Cybersecurity Threat Detection Agent
====================================

A full-stack AI-powered network traffic analysis system built with Next.js 15 (frontend) and Flask (backend). 
It detects potential threats in real-time, provides live alerts, visualizations, and allows export of data for further analysis.

Features
--------

- Real-time Threat Detection: Submit network traffic data and get AI-based predictions.
- Alerts Dashboard: View live alerts with sortable, searchable, and paginated tables.
- Visual Analytics:
  - Pie chart for threat distribution (Attacks vs Normal traffic)
  - Bar chart for protocol-based alerts
- Export Alerts: Export alerts data to CSV for reporting or offline analysis.
- Dark Mode: Toggle between light and dark themes.
- Responsive UI: Works on desktops, tablets, and mobile devices.
- Form Validation: Validates IP addresses, port numbers, and required fields.
- Live Updates: Alerts dashboard automatically refreshes every 5 seconds.

Tech Stack
----------

Frontend:
- Next.js 15
- React Hooks (useState, useEffect, useMemo)
- Recharts – for charts
- Framer Motion – for smooth animations
- React Hot Toast – for notifications
- TailwindCSS – for styling
- Next-Themes – dark/light theme management

Backend:
- Flask – API server for AI predictions
- Python – AI model for threat detection
- Flask-CORS – for cross-origin requests

Utilities:
- Axios – HTTP client
- Papaparse – CSV export

Project Structure
-----------------

project-root/
├─ app/                 # Next.js app folder
│  ├─ page.js           # Main page component
│  ├─ components/       # Reusable components
│  └─ styles/globals.css
├─ backend/             # Flask backend
│  ├─ app.py            # Main API
│  └─ model.py          # AI model script
├─ .env.local           # Environment variables (API URLs)
├─ package.json
├─ tailwind.config.js
└─ README.txt

Setup Instructions
------------------

Frontend (Next.js):

1. Clone the repo:
   git clone <repo-url>
   cd project-root

2. Install dependencies:
   pnpm install

3. Configure environment variable for API:
   NEXT_PUBLIC_API_URL=http://127.0.0.1:5000

4. Run development server:
   pnpm dev

Frontend will run on http://localhost:3000.

Backend (Flask):

1. Navigate to backend folder:
   cd backend

2. Create virtual environment:
   python -m venv venv
   source venv/bin/activate    # Linux/macOS
   venv\Scripts\activate       # Windows

3. Install dependencies:
   pip install -r requirements.txt

4. Run the API server:
   python app.py

Backend will run on http://127.0.0.1:5000.

Usage
-----

1. Open frontend in browser: http://localhost:3000
2. Submit network traffic details in the Analyze Network Traffic form.
3. View results and probability.
4. Monitor alerts dashboard with real-time updates.
5. Export data using Export CSV button.

Notes
-----

- Make sure the backend is running before submitting traffic from the frontend.
- Dark mode can be toggled using the button on the top-right corner.
- Charts are automatically updated when new alerts arrive.

Future Improvements
-------------------

- Add authentication & role-based access.
- Integrate WebSocket for true real-time alerts without polling.
- Advanced AI model for multi-class threat detection.
- Notification system via email or Slack.
- Filter and customize charts (protocol, time range, threat type).

License
-------

This project is for demo purposes only. Use it responsibly and only on test networks.
