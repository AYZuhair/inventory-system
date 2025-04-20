Inventory Management System (IMS) User Manual
 
Version: 1.0.0Last Updated: April 20, 2025Repository: github.com/your-repo/ims 
Table of Contents

Introduction
Prerequisites
Installation
Configuration
Running the System
Usage Instructions
Logging In
Admin Functions
Staff Functions


Security Features
Troubleshooting
FAQs
Contributing
License


Introduction
The Inventory Management System (IMS) is a secure web application designed to streamline inventory tracking, user management, and operational oversight for businesses. Built with Node.js, Express, Supabase (PostgreSQL), and a JavaScript/HTML/CSS frontend, the IMS supports two user roles:

Admins: Manage inventory, create staff accounts, and access audit logs.
Staff: Report low stock, request inventory adjustments, and view inventory.

The IMS incorporates robust security features, including:

Supabase: Cloud-based database with encryption and role-based access control (RLS).
Token-Based Authentication: Prevents unauthorized access with server-side token validation.
Audit Logging: Tracks all actions for accountability.

This user manual provides detailed instructions for setting up, running, and using the IMS, ensuring both technical administrators and end-users can operate the system effectively.

Prerequisites
Before setting up the IMS, ensure you have the following:
Hardware

Computer: Minimum 4GB RAM, 2GHz processor.
Internet: Stable connection for Supabase and dependency downloads.

Software

Node.js: Version 18.x or later (Download).
npm: Included with Node.js for package management.
Git: For cloning the repository (Download).
Web Browser: Chrome, Firefox, or Edge (latest versions).
Supabase Account: Free tier or higher (Sign Up).

Dependencies
See the requirements.txt for non-Node.js prerequisites and package.json for Node.js dependencies, detailed in the Installation section.

Installation
Follow these steps to install the IMS on your local machine.
Step 1: Clone the Repository

Open a terminal (e.g., Command Prompt, Terminal, or PowerShell).
Clone the IMS repository:git clone https://github.com/your-repo/ims.git
cd ims

Replace your-repo with the actual repository URL.

Step 2: Install Node.js Dependencies

Ensure Node.js and npm are installed:node --version
npm --version

Expected output: v18.x.x for Node.js, 9.x.x or later for npm.
Install dependencies listed in package.json:npm install

This installs:
express: Web framework for Node.js.
@supabase/supabase-js: Supabase client for database interactions.
crypto: For token generation (Node.js built-in).See package.json below for details.



Step 3: Install Additional Prerequisites
The requirements.txt file lists non-Node.js prerequisites:
# requirements.txt
Node.js>=18.0.0
npm>=9.0.0
git>=2.0.0


Install Node.js and npm from nodejs.org if not already installed.
Install Git from git-scm.com for repository cloning.

Step 4: Verify Installation

Confirm dependencies are installed:npm list

Expected output: Lists express, @supabase/supabase-js, etc.
Ensure Supabase account is active (see Configuration).


Configuration
Configure the IMS to connect to Supabase and set up environment variables.
Step 1: Set Up Supabase

Create a Supabase Project:
Log in to Supabase Dashboard.
Click New Project, select a name (e.g., ims-project), and choose a region.
Wait ~2 minutes for project initialization.


Obtain Supabase Credentials:
Navigate to Settings > API.
Copy the Project URL (e.g., https://qjxkhydsmpfvehjmyhhc.supabase.co).
Copy the Service Role Key (e.g., eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...).Keep the service key secure; do not share publicly.


Create Tables:
Go to Table Editor or SQL Editor and run the following SQL to create tables:CREATE TABLE admin (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL
);
CREATE TABLE staff (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL
);
CREATE TABLE inventory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    price DECIMAL NOT NULL,
    description TEXT
);
CREATE TABLE actions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    action_type TEXT NOT NULL,
    details TEXT,
    created_by TEXT,
    timestamp TIMESTAMP DEFAULT NOW(),
    meta JSONB
);
CREATE TABLE lowstock (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    item_id UUID REFERENCES inventory(id),
    quantity INTEGER NOT NULL,
    reported_by TEXT
);
CREATE TABLE requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    item_id UUID REFERENCES inventory(id),
    quantity INTEGER NOT NULL,
    status TEXT DEFAULT 'pending'
);




Configure RLS Policies:
In Authentication > Policies, create RLS policies for each table:
admin: INSERT/UPDATE/DELETE for auth.role() = 'admin'.
staff: INSERT/UPDATE/DELETE for auth.role() = 'admin', SELECT for auth.role() IN ('admin', 'staff').
inventory: INSERT/UPDATE/DELETE for auth.role() = 'admin', SELECT for auth.role() IN ('admin', 'staff').
actions: INSERT for authenticated users, SELECT for auth.role() = 'admin'.
lowstock, requests: INSERT/SELECT for auth.role() IN ('admin', 'staff'), UPDATE/DELETE for auth.role() = 'admin'.


Enable RLS for each table in the Table Editor.



Step 2: Set Up Environment Variables

Create a .env file in the ims directory:touch .env


Add the following:SUPABASE_URL=https://qjxkhydsmpfvehjmyhhc.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
PORT=3000

Replace with your Supabase URL and key. The PORT defaults to 3000.

Step 3: Verify Configuration

Test Supabase connection by running a sample query in the SQL Editor:SELECT * FROM admin;


Ensure .env is loaded correctly (see Running the System).


Running the System
Start the IMS server and access the web interface.
Step 1: Start the Node.js Server

In the ims directory, run:npm start

This runs node server.js, starting the server on http://localhost:3000.
Verify the server is running:
Open a browser and navigate to http://localhost:3000.
The login page (index.html) should load.



Step 2: Access the Web Interface

URL: http://localhost:3000
Browser: Use Chrome, Firefox, or Edge for best compatibility.
Login Page: Displays a form for username, password, and role (admin/staff).

Step 3: Stop the Server

Press Ctrl+C in the terminal to stop the server.


Usage Instructions
This section guides users through the IMS’s functionalities, divided by role.
Logging In

Access the Login Page:
Navigate to http://localhost:3000.
The login form is displayed (see screenshot below). 


Enter Credentials:
Username: Your assigned username (e.g., admin1 for admins, staff1 for staff).
Password: Your secure password.
Role: Select Admin or Staff from the dropdown.


Submit:
Click Login. If credentials are valid, you’ll be redirected to:
admin.html for admins.
staff.html for staff.


If invalid, an error message appears (e.g., “Invalid credentials”).


Logout:
Click Logout on the dashboard to clear the session and return to the login page.



Best Practices:

Use strong passwords (minimum 12 characters, mixed case, numbers, symbols).
Do not share credentials.
Contact the system administrator if you forget your password.

Admin Functions
Admins manage inventory, create staff accounts, and access audit logs.
Staff Creation

Navigate to Staff Creation:
On admin.html, find the Create Staff form (see screenshot). 


Enter Details:
Username: Unique username for the new staff (e.g., staff2).
Password: Secure password for the staff account.


Submit:
Click Create. If successful, a confirmation appears (“Staff created successfully”).
The action is logged in the actions table for audit purposes.


Error Handling:
Missing fields: “Missing required fields.”
Unauthorized: “Forbidden: Admins only.”



Inventory Management

Navigate to Inventory Management:
On admin.html, find the Inventory Management section.


Perform Operations:
Create Item: Enter name, quantity, price, and description; click Add Item.
Update Item: Select an item, modify details, and click Update.
Delete Item: Select an item and click Delete.


Confirmation:
Successful operations display “Operation successful.”
Actions are logged in the actions table.


Error Handling:
Invalid input: “Invalid input.”
Unauthorized: “Forbidden: Admins only.”



Audit Log Access

Navigate to Audit Logs:
On admin.html, click View Audit Logs.


View Logs:
Displays a table of actions (action type, details, user, timestamp).
Example: “staffCreation, Staff Creation: staff2, admin1, 2025-04-20T10:00:00Z.”


Error Handling:
Unauthorized: “Forbidden: Admins only.”



Best Practices:

Regularly review audit logs for suspicious activity.
Restrict admin access to authorized personnel only.

Staff Functions
Staff report low stock and request inventory adjustments.
Low Stock Reporting

Navigate to Low Stock Reporting:
On staff.html, find the Report Low Stock form. 


Enter Details:
Item ID: Select an item from the inventory list.
Quantity: Enter the low stock quantity.


Submit:
Click Report. If successful, “Report submitted” appears.
The report is logged in the lowstock table and actions table.


Error Handling:
Invalid input: “Invalid input.”
Unauthorized: “Forbidden.”



Inventory Adjustment Requests

Navigate to Requests:
On staff.html, find the Request Adjustment form.


Enter Details:
Item ID: Select an item.
Quantity: Enter the requested quantity.


Submit:
Click Request. If successful, “Request submitted” appears.
The request is logged in the requests table and actions table.


Error Handling:
Invalid input: “Invalid input.”
Unauthorized: “Forbidden.”



Best Practices:

Verify item IDs before reporting or requesting adjustments.
Communicate with admins for request approvals.


Security Features
The IMS incorporates advanced security measures to protect data and ensure authorized access.

Supabase Database:
Encryption: Data is encrypted at rest (AES-256) and in transit (HTTPS), safeguarding user credentials and inventory details (PostgreSQL, 2025).
Role-Based Access Control (RLS): Restricts table access based on user roles, preventing unauthorized operations (e.g., staff cannot create staff accounts) (OWASP, 2023).
Audit Logging: Tracks all actions in the actions table, enabling forensic analysis (IBM Security, 2024).


Token-Based Authentication:
Session Tokens: Generated upon login, validated server-side to prevent bypassing (Mozilla Developer Network, 2025).
Server-Side Authorization: Ensures only authorized roles access protected pages (OWASP, 2023).
HTTPS: Encrypts communication, protecting tokens from interception.


Best Practices:
Regularly update passwords and Supabase keys.
Monitor audit logs for anomalies.
Use secure networks to access the IMS.




Troubleshooting
Common issues and solutions:

Issue: Server fails to start (npm start).
Solution: Verify Node.js and npm versions (node --version, npm --version). Reinstall dependencies (npm install).


Issue: Supabase connection error.
Solution: Check .env file for correct SUPABASE_URL and SUPABASE_KEY. Ensure Supabase project is active.


Issue: “Invalid credentials” on login.
Solution: Confirm username, password, and role. Contact the admin to reset credentials.


Issue: “Unauthorized” or “Forbidden” errors.
Solution: Ensure correct role is selected. Verify token in localStorage (browser developer tools).


Issue: Page not loading.
Solution: Check server status (http://localhost:3000). Clear browser cache.



Contact Support:

File an issue on the GitHub repository.
Email: support@ims.example.com 


FAQs

How do I reset my password?
Contact the system administrator to update your password in the admin or staff table via Supabase.


Can staff view audit logs?
No, audit logs are admin-only due to RLS policies.


What happens if I forget my username?
Check with your administrator, who can query the Supabase database.


Is my data secure?
Yes, the IMS uses encryption, RLS, and token-based authentication to ensure data security.


Can I use the IMS offline?
No, an internet connection is required for Supabase and server access.




Contributing
We welcome contributions to improve the IMS. To contribute:

Fork the repository.
Create a branch (git checkout -b feature/your-feature).
Commit changes (git commit -m "Add your feature").
Push to your fork (git push origin feature/your-feature).
Open a pull request on GitHub.

Issues:

Report bugs or feature requests via GitHub Issues.


License
This project is licensed under the MIT License. See the LICENSE file for details.

Thank you for using the IMS! For further assistance, refer to the GitHub repository or contact support.
