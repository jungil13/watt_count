# WattCount Frontend

Vue 3 frontend for the WattCount electricity billing and consumption management system.

## Setup Instructions

### 1. Install Dependencies

```bash
cd wattcount
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the `wattcount` directory (optional, defaults to localhost:3000):

```env
VITE_API_URL=http://localhost:3000/api
```

### 3. Run Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:5173` (or the port shown in the terminal)

### 4. Build for Production

```bash
npm run build
```

## Features

### Main User (Administrator)
- Register and login
- Generate shared codes for connecting users
- Manage shared users (view, deactivate)
- Input electricity consumption readings
- Set electricity rates
- Create and manage bills
- View all consumption records and bills
- Record payments

### Shared User
- Connect using shared code from Main User
- View personal consumption records
- View personal bills
- Record payments for own bills
- View consumption summaries

## Project Structure

```
src/
├── assets/          # CSS and static assets
├── components/      # Reusable Vue components
├── router/          # Vue Router configuration
├── services/        # API service layer
├── store/           # State management (auth)
└── views/           # Page components
    ├── LoginView.vue
    ├── RegisterView.vue
    ├── ConnectView.vue
    ├── DashboardView.vue
    ├── ConsumptionView.vue
    ├── BillsView.vue
    ├── UsersView.vue (Main User only)
    └── SettingsView.vue (Main User only)
```

## Usage

1. **Main User Registration**: Register as a main user to get started
2. **Generate Shared Code**: After registration, generate a shared code
3. **Share Code**: Give the code to users who want to connect
4. **Shared User Connection**: Users can connect using the shared code
5. **Input Consumption**: Main user inputs meter readings
6. **Generate Bills**: Bills are automatically created when consumption records include billing cycles
7. **Record Payments**: Users can record payments for their bills
