# Freelance Tracker — Feature Checklist

Mark features `[x]` as we complete them.

---

## Build Steps

- [x] **Step 1** — Boilerplate: Vite + React + Tailwind + React Router + Zustand + folder structure
- [x] **Step 2** — Company management: add/edit/delete companies with hourly rates
- [x] **Step 3** — Shift logging: add shift (company, date, start/end time), auto-calc hours + pay
- [x] **Step 4** — Shift list view: filter by company, pay display per shift
- [x] **Step 5** — Dashboard: earnings summary (this week / this month), unpaid balance, quick stats
- [x] **Step 6** — Calendar view: shifts rendered on react-big-calendar (month + week)
- [x] **Step 7** — Todo list: add, complete, delete todos
- [x] **Step 8** — Reports + payment status: earnings by company, mark individual shifts paid/unpaid
- [ ] **Step 9** — Earnings chart: Recharts bar chart by week/month
- [ ] **Step 10** — Polish: mobile responsive, empty states, nav sidebar refinements

---

## Features by Category

### Companies
- [x] Add a company (name, hourly rate, color tag)
- [x] Edit company details
- [x] Delete company

### Shifts
- [x] Log a shift (company, date, start time, end time)
- [x] Auto-calculate hours from start/end
- [x] Auto-calculate pay from hours × hourly rate
- [x] View all shifts in a table
- [x] Filter shifts by company
- [ ] Filter shifts by date range
- [x] Delete a shift

### Calendar
- [x] View shifts on a monthly calendar
- [x] View shifts on a weekly calendar
- [ ] Click a date to add a shift

### Dashboard
- [x] Total earnings this week
- [x] Total earnings this month
- [x] Total hours this week
- [x] Total hours this month
- [x] Recent shifts list

### Reports
- [x] Earnings grouped by company
- [x] Mark individual shifts as paid/unpaid
- [ ] Mark all shifts for a company as paid at once
- [ ] Filter reports by date range

### Earnings Chart
- [ ] Bar chart of earnings by week
- [ ] Toggle to earnings by month

### Todos
- [x] Add a todo
- [x] Mark todo as complete
- [x] Delete a todo
