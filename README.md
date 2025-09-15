# 3d_printer_farm_manager

The purpose of this system is to control multiple 3D printers from a single computer, with queue management for each printer, a user management system, and a maintenance module. For now, this implementation works only with Creality printers using Klipper.

# 🛠️ Project Setup

Before starting the app, make sure to create a .env file in the root directory with the following content:

DB_HOST=<your_database_host>
DB_USER=<your_database_user>
DB_PASS=<your_database_password>
DB_DB=<your_database_name>

HOST_IP=<your_server_ip>
PORT=<your_preferred_port>

Replace each placeholder (<...>) with your actual configuration values.


# 🚀 How to Run

Open your terminal (CMD, PowerShell, bash, etc.) in the root folder of the project and run:
npm install
npm start

Your app should now be up and running! 🎉

# 🧪 Need Help?

If you run into issues, double-check your .env values and ensure all dependencies are installed.