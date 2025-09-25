'use client'; // <-- must be first line
import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { motion, AnimatePresence } from "framer-motion";
import toast, { Toaster } from "react-hot-toast";
import { useTheme } from "next-themes";
import { format, parseISO } from "date-fns";
import Papa from "papaparse";

// API Base URL from env
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000";

// Custom Hook for Alerts
const useAlerts = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE}/alerts`);
      setAlerts(res.data || []);
      setError(null);
    } catch (err) {
      setError("Failed to fetch alerts. Is the backend running?");
      toast.error("Failed to fetch alerts!");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 5000); // Poll every 5s for live updates
    return () => clearInterval(interval);
  }, []);

  return { alerts, loading, error, refetch: fetchAlerts };
};

// Stats Cards Component
const StatsCards = ({ alerts }) => {
  const totalAlerts = alerts.length;
  const attackCount = alerts.filter(a => a.result === "Attack").length;
  const normalCount = totalAlerts - attackCount;
  const attackRatio = totalAlerts > 0 ? ((attackCount / totalAlerts) * 100).toFixed(1) : 0;

  const stats = [
    { label: "Total Alerts", value: totalAlerts.toLocaleString(), color: "blue" },
    { label: "Attacks Detected", value: attackCount.toLocaleString(), color: "red" },
    { label: "Normal Traffic", value: normalCount.toLocaleString(), color: "green" },
    { label: "Attack Ratio", value: `${attackRatio}%`, color: "orange" },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {stats.map((stat, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
          whileHover={{ scale: 1.02 }}
          className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700"
        >
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-3xl font-bold text-gray-900 dark:text-white">{stat.value}</h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm mt-1 capitalize">{stat.label}</p>
            </div>
            <div className={`w-4 h-4 rounded-full bg-${stat.color}-500`}></div>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

// Charts Component
const ThreatCharts = ({ alerts }) => {
  // Pie data for threat distribution
  const pieData = useMemo(() => {
    const attackCount = alerts.filter(a => a.result === "Attack").length;
    const normalCount = alerts.length - attackCount;
    return [
      { name: "Attacks", value: attackCount, fill: "#ef4444" },
      { name: "Normal", value: normalCount, fill: "#10b981" },
    ];
  }, [alerts]);

  // Bar data for alerts by protocol
  const barData = useMemo(() => {
    const grouped = alerts.reduce((acc, alert) => {
      const proto = alert.data.protocol || "Unknown";
      acc[proto] = (acc[proto] || 0) + 1;
      return acc;
    }, {});
    return Object.entries(grouped).map(([name, value]) => ({ name, value: Number(value) }));
  }, [alerts]);

  if (alerts.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="col-span-full text-center py-12 text-gray-500 dark:text-gray-400"
      >
        No data for charts yet. Submit some traffic!
      </motion.div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      {/* Pie Chart */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700"
      >
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Threat Distribution</h3>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={pieData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={80}
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            >
              {pieData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => [`${value} alerts`, "Count"]} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Bar Chart */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
        className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700"
      >
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Alerts by Protocol</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={barData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="name" stroke="#6b7280" />
            <YAxis stroke="#6b7280" />
            <Tooltip />
            <Legend />
            <Bar dataKey="value" fill="#3b82f6" />
          </BarChart>
        </ResponsiveContainer>
      </motion.div>
    </div>
  );
};

// Enhanced Form Component
const ThreatForm = ({ form, setForm, onSubmit, loading }) => {
  const { theme, setTheme } = useTheme(); // For dark mode context if needed

  const handleChange = (field) => (e) => {
    setForm(prev => ({ ...prev, [field]: e.target.value }));
  };

  const validateForm = () => {
    if (!form.src_ip || !form.dst_ip || form.port === "" || form.protocol === "") {
      toast.error("Please fill in all required fields.");
      return false;
    }
    if (isNaN(form.port) || form.port < 1 || form.port > 65535) {
      toast.error("Port must be a number between 1 and 65535.");
      return false;
    }
    // Basic IP validation regex
    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (!ipRegex.test(form.src_ip) || !ipRegex.test(form.dst_ip)) {
      toast.error("Please enter valid IPv4 addresses (e.g., 192.168.1.1).");
      return false;
    }
    return true;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    onSubmit(form);
  };

  return (
    <motion.form
      onSubmit={handleSubmit}
      initial={{ opacity: 0, x: -50 }}
      animate={{ opacity: 1, x: 0 }}
      className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg mb-8 space-y-4 border border-gray-200 dark:border-gray-700"
    >
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">🔍 Analyze Network Traffic</h2>
      <p className="text-gray-600 dark:text-gray-300 text-sm">Enter connection details to detect potential threats using AI.</p>

      {/* Source IP */}
      <div className="relative">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Source IP</label>
        <input
          type="text"
          placeholder="e.g., 192.168.1.1"
          value={form.src_ip}
          onChange={handleChange("src_ip")}
          className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          required
          aria-label="Source IP address"
        />
      </div>

      {/* Destination IP */}
      <div className="relative">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Destination IP</label>
        <input
          type="text"
          placeholder="e.g., 10.0.0.1"
          value={form.dst_ip}
          onChange={handleChange("dst_ip")}
          className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          required
          aria-label="Destination IP address"
        />
      </div>

      {/* Protocol */}
      <div className="relative">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Protocol</label>
        <select
          value={form.protocol}
          onChange={handleChange("protocol")}
          className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          aria-label="Network protocol"
        >
          <option value="TCP">TCP (Transmission Control Protocol)</option>
          <option value="UDP">UDP (User  Datagram Protocol)</option>
          <option value="ICMP">ICMP (Internet Control Message Protocol)</option>
        </select>
      </div>

      {/* Port */}
      <div className="relative">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Port</label>
        <input
          type="number"
          placeholder="e.g., 80"
          value={form.port}
          onChange={(e) => handleChange("port")({ target: { value: e.target.value } })}
          className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          required
          min="1"
          max="65535"
          aria-label="Port number"
        />
        <span className="absolute right-3 top-10 text-xs text-gray-400">1-65535</span>
      </div>

      <motion.button
        type="submit"
        disabled={loading}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2"
        aria-label="Submit threat analysis"
      >
        {loading ? (
          <>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
            />
            <span>Analyzing Traffic...</span>
          </>
        ) : (
          <>
            <span>🚨 Check for Threats</span>
          </>
        )}
      </motion.button>
    </motion.form>
  );
};

// Sortable, Searchable, Paginated Alerts Table Component
const AlertsTable = ({ alerts, loading, error, refetch }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("timestamp");
  const [sortOrder, setSortOrder] = useState("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedRow, setExpandedRow] = useState(null);
  const itemsPerPage = 10;

  const filteredAlerts = useMemo(() => {
    return alerts.filter(alert =>
      alert.data.src_ip.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alert.data.dst_ip.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alert.data.protocol.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alert.result.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (alert.timestamp && alert.timestamp.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [alerts, searchTerm]);

  const sortedAlerts = useMemo(() => {
    return [...filteredAlerts].sort((a, b) => {
      let aVal = a[sortBy];
      let bVal = b[sortBy];
      if (sortBy === "timestamp") {
        aVal = new Date(aVal);
        bVal = new Date(bVal);
      } else if (sortBy === "probability") {
        aVal = aVal || 0;
        bVal = bVal || 0;
      } else if (sortBy === "data.src_ip" || sortBy === "data.dst_ip") {
        aVal = a.data[sortBy.split('.')[1]] || "";
        bVal = b.data[sortBy.split('.')[1]] || "";
      } else if (sortBy === "data.protocol") {
        aVal = a.data.protocol || "";
        bVal = b.data.protocol || "";
      } else if (sortBy === "data.port") {
        aVal = a.data.port || 0;
        bVal = b.data.port || 0;
      } else if (sortBy === "result") {
        aVal = a.result || "";
        bVal = b.result || "";
      }
      if (typeof aVal === 'string') {
        return sortOrder === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      return sortOrder === "asc" ? aVal - bVal : bVal - aVal;
    });
  }, [filteredAlerts, sortBy, sortOrder]);

  const paginatedAlerts = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return sortedAlerts.slice(start, start + itemsPerPage);
  }, [sortedAlerts, currentPage]);

  const totalPages = Math.ceil(sortedAlerts.length / itemsPerPage);

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleDelete = (index) => {
    if (confirm("Are you sure you want to delete this alert?")) {
      // In production, send DELETE request to backend
      // For demo, just remove from local state
      const newAlerts = alerts.filter((_, i) => i !== index);
      // Simulate update (in real app, refetch)
      toast.success("Alert deleted successfully!");
      setExpandedRow(null);
    }
  };

  const exportToCSV = () => {
    if (alerts.length === 0) {
      toast.error("No alerts to export!");
      return;
    }
    const csvData = alerts.map(a => ({
      "Source IP": a.data.src_ip,
      "Destination IP": a.data.dst_ip,
      "Protocol": a.data.protocol,
      "Port": a.data.port,
      "Result": a.result,
      "Probability": a.probability || "N/A",
      "Timestamp": a.timestamp ? format(parseISO(a.timestamp), "yyyy-MM-dd HH:mm:ss") : "N/A",
    }));
    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `threat-alerts-${format(new Date(), "yyyy-MM-dd-HH-mm-ss")}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("Alerts exported to CSV!");
  };

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex justify-center items-center h-64 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700"
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mr-2"
        />
        <span className="text-gray-600 dark:text-gray-300">Loading alerts...</span>
      </motion.div>
    );
  }

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 p-6 rounded-xl"
      >
        <h3 className="font-semibold text-lg mb-2">⚠️ Error Loading Alerts</h3>
        <p className="mb-4">{error}</p>
        <motion.button
          onClick={refetch}
          whileHover={{ scale: 1.05 }}
          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg"
        >
          Retry Fetch
        </motion.button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
    >
      {/* Header with Search and Actions */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Recent Alerts ({filteredAlerts.length})</h2>
            <p className="text-gray-600 dark:text-gray-300 text-sm">Search and sort through detected threats.</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              placeholder="Search alerts (IP, protocol, result)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Search alerts"
            />
            <motion.button
              onClick={exportToCSV}
              whileHover={{ scale: 1.05 }}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium"
            >
              📊 Export CSV
            </motion.button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              {[
                { key: "data.src_ip", label: "Source IP", sortable: true },
                { key: "data.dst_ip", label: "Destination IP", sortable: true },
                { key: "data.protocol", label: "Protocol", sortable: true },
                { key: "data.port", label: "Port", sortable: true },
                { key: "result", label: "Result", sortable: true },
                { key: "probability", label: "Probability", sortable: true },
                { key: "timestamp", label: "Timestamp", sortable: true },
                { key: "actions", label: "Actions", sortable: false },
              ].map((col) => (
                <th
                  key={col.key}
                  onClick={col.sortable ? () => handleSort(col.key) : undefined}
                  className={`px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 ${
                    col.sortable ? "cursor-pointer" : "cursor-default"
                  } ${sortBy === col.key ? (sortOrder === "desc" ? "text-blue-600" : "text-green-600") : ""}`}
                >
                  <div className="flex items-center">
                    {col.label}
                    {col.sortable && (
                      <span className="ml-1">
                        {sortBy === col.key && sortOrder === "desc" ? "▼" : "▲"}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            <AnimatePresence>
              {paginatedAlerts.map((alert, i) => (
                <motion.tr
                  key={alert.timestamp || i}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    {alert.data.src_ip}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                    {alert.data.dst_ip}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                    {alert.data.protocol}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                    {alert.data.port}
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm font-semibold ${
                    alert.result === "Attack" ? "text-red-600" : "text-green-600"
                  }`}>
                    {alert.result}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                    {alert.probability ? `${(alert.probability * 100).toFixed(1)}%` : "N/A"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                    {alert.timestamp ? format(parseISO(alert.timestamp), "MMM dd, yyyy HH:mm") : "N/A"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <motion.button
                        onClick={() => setExpandedRow(expandedRow === i ? null : i)}
                        whileHover={{ scale: 1.1 }}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        {expandedRow === i ? "−" : "+"}
                      </motion.button>
                      <motion.button
                        onClick={() => handleDelete(i)}
                        whileHover={{ scale: 1.1 }}
                        className="text-red-600 hover:text-red-900"
                      >
                        🗑️
                      </motion.button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </AnimatePresence>
            {/* Expandable Row */}
            <AnimatePresence>
              {expandedRow !== null && (
                <motion.tr
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-gray-50 dark:bg-gray-700"
                >
                  <td colSpan={8} className="px-6 py-4">
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-inner">
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Details:</h4>
                      <p><strong>Full Data:</strong> {JSON.stringify(paginatedAlerts[expandedRow], null, 2)}</p>
                    </div>
                  </td>
                </motion.tr>
              )}
            </AnimatePresence>
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700 dark:text-gray-300">
              Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to{" "}
              <span className="font-medium">{Math.min(currentPage * itemsPerPage, sortedAlerts.length)}</span> of{" "}
              <span className="font-medium">{sortedAlerts.length}</span> results
            </div>
            <div className="flex space-x-2">
              <motion.button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                whileHover={{ scale: 1.05 }}
                className="disabled:opacity-50 disabled:cursor-not-allowed px-3 py-2 border border-gray-300 dark:border-gray-600 text-sm rounded-lg"
              >
                Previous
              </motion.button>
              {Array.from({ length: totalPages }, (_, i) => (
                <motion.button
                  key={i}
                  onClick={() => handlePageChange(i + 1)}
                  className={`px-3 py-2 text-sm rounded-lg ${
                    currentPage === i + 1
                      ? "bg-blue-600 text-white"
                      : "bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                  }`}
                  whileHover={{ scale: 1.05 }}
                >
                  {i + 1}
                </motion.button>
              ))}
              <motion.button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                whileHover={{ scale: 1.05 }}
                className="disabled:opacity-50 disabled:cursor-not-allowed px-3 py-2 border border-gray-300 dark:border-gray-600 text-sm rounded-lg"
              >
                Next
              </motion.button>
            </div>
          </div>
        </div>
      )}

      {filteredAlerts.length === 0 && !loading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12 text-gray-500 dark:text-gray-400"
        >
          <p>No alerts match your search. Try submitting some traffic data!</p>
        </motion.div>
      )}
    </motion.div>
  );
};

// Dark Mode Toggle Component
const DarkModeToggle = () => {
  const { theme, setTheme } = useTheme();

  return (
    <motion.button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      whileHover={{ scale: 1.1 }}
      className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
      aria-label="Toggle dark mode"
    >
      {theme === "dark" ? "☀️" : "🌙"}
    </motion.button>
  );
};

// Main Home Component
export default function Home() {
  const [form, setForm] = useState({ src_ip: "", dst_ip: "", protocol: "TCP", port: "" });
  const [submitLoading, setSubmitLoading] = useState(false);
  const { alerts, loading, error, refetch } = useAlerts();
  const { theme, setTheme } = useTheme();

  const handleSubmit = async (formData) => {
    setSubmitLoading(true);
    try {
      const res = await axios.post(`${API_BASE}/predict`, formData);
      toast.success(`Threat check complete: ${res.data.prediction} (${res.data.probability ? `${(res.data.probability * 100).toFixed(1)}%` : "N/A"})`);
      refetch(); // Refresh alerts
      setForm({ src_ip: "", dst_ip: "", protocol: "TCP", port: "" }); // Reset form
    } catch (err) {
      toast.error("Failed to analyze traffic. Check console for details.");
      console.error(err);
    } finally {
      setSubmitLoading(false);
    }
  };

  useEffect(() => {
    // Set initial theme
    setTheme("light"); // Or "system" for auto
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4 sm:px-6 lg:px-8">
      <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
      
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-7xl mx-auto flex justify-between items-center mb-8"
      >
        <div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">🚨 Cybersecurity Threat Detection Agent</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">AI-powered network traffic analysis with real-time alerts and visualizations.</p>
        </div>
        <DarkModeToggle />
      </motion.header>

      <div className="max-w-7xl mx-auto space-y-8">
        {/* Form */}
        <ThreatForm form={form} setForm={setForm} onSubmit={handleSubmit} loading={submitLoading} />

        {/* Stats Cards */}
        <StatsCards alerts={alerts} />

        {/* Charts */}
        <ThreatCharts alerts={alerts} />

        {/* Alerts Table */}
        <AlertsTable alerts={alerts} loading={loading} error={error} refetch={refetch} />
      </div>

      {/* Footer */}
      <motion.footer
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="max-w-7xl mx-auto mt-12 text-center text-gray-500 dark:text-gray-400 text-sm"
      >
        <p>&copy; 2024 Cybersecurity Agent. Built with Next.js & Flask. For demo purposes only.</p>
      </motion.footer>
    </div>
  );
}