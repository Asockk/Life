# Blood Pressure Tracker 📊❤️

## Overview

Blood Pressure Tracker is a comprehensive web application designed to help users monitor and analyze their blood pressure measurements. The app provides a user-friendly interface for recording daily blood pressure readings, tracking contextual factors, and generating detailed medical reports.

## 🌟 Features

### 1. Blood Pressure Logging
- Record morning and evening blood pressure measurements
- Track systolic and diastolic pressure
- Monitor pulse rate
- Support for daily entries

### 2. Context Tracking
Understand how various lifestyle factors might influence your blood pressure:
- Stress levels
- Sleep quality
- Physical activity
- Salt intake
- Caffeine consumption
- Alcohol consumption

### 3. Data Visualization
- Interactive line charts showing blood pressure trends
- Moving average calculations
- Comparison between morning and evening measurements

### 4. Analysis and Reporting
- Automatic blood pressure category classification
- Minimum and maximum value tracking
- Comprehensive medical report generation
- Export data to CSV
- PDF report creation

### 5. User-Friendly Interface
- Responsive design (mobile and desktop)
- Easy data entry
- Intuitive navigation
- Context factor tracking

## 🛠 Technologies Used

- React
- Tailwind CSS
- Recharts (for data visualization)
- jsPDF (for report generation)
- Lucide React (for icons)
- Papaparse (for CSV handling)

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or later)
- npm or yarn

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/blood-pressure-tracker.git
cd blood-pressure-tracker
```

2. Install dependencies
```bash
npm install
# or
yarn install
```

3. Start the development server
```bash
npm start
# or
yarn start
```

## 📦 Project Structure

```
src/
│
├── components/
│   ├── Dashboard/        # Dashboard-related components
│   ├── Forms/            # Data entry forms
│   ├── Reports/          # Report generation components
│   ├── Table/            # Data table component
│   └── UI/               # Shared UI components
│
├── hooks/                # Custom React hooks
│   └── useBloodPressureData.js
│
├── utils/                # Utility functions
│   ├── bloodPressureUtils.js
│   ├── dataUtils.js
│   ├── validationUtils.js
│   └── csvExportUtils.js
│
└── contexts/             # React contexts
    └── DialogContext.js
```

## 📊 Blood Pressure Categories

The app classifies blood pressure into the following categories:
- Optimal: <120/<80 mmHg
- Normal: 120-129/<80 mmHg
- High Normal: 130-139/80-89 mmHg
- Hypertension Grade 1: 140-159/90-99 mmHg
- Hypertension Grade 2: 160-179/100-109 mmHg
- Hypertension Grade 3: ≥180/≥110 mmHg

## 🔍 Key Components

### Data Entry
- Capture daily blood pressure measurements
- Record contextual health factors
- Validate input data

### Visualization
- Interactive line charts
- Moving average calculation
- Trend analysis

### Reporting
- Generate comprehensive medical reports
- Export data to CSV and PDF
- Share with healthcare professionals

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 🔒 Data Privacy

- All data is stored locally
- No cloud storage or external data sharing
- User has full control over their health data

## 📱 Responsive Design

The application is fully responsive and works seamlessly on:
- Desktop browsers
- Tablets
- Mobile devices

## 🚧 Future Roadmap
- [ ] More detailed health insights
- [ ] Integration with health tracking devices

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

**Disclaimer**: This application is not a medical device. Always consult with a healthcare professional for medical advice and interpretation of your health data.