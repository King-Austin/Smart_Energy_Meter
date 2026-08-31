# Meter — Lovable Build Prompt

Create a modern, mobile-first smart whole-house energy meter application called **Meter**.

Meter is designed for a **whole-house smart electricity meter**. This is **not a multi-appliance control system**. Each physical Meter device represents the electrical supply and consumption of an entire house, apartment, shop, or small property.

The application should allow users to:

- Monitor total whole-house electricity consumption in real time.
- Understand energy usage, trends, and estimated electricity cost.
- Check grid status, meter connectivity, and backup battery status.
- View historical energy usage.
- Securely share electrical energy with another registered Meter device.
- Receive energy from another Meter device.
- Manage all energy sharing through the cloud.

The experience should feel like a premium smart-home or fintech utility app: **simple, minimal, modern, trustworthy, and easy to understand within a few seconds**.

Do not design it like an engineering dashboard.

Avoid excessive gauges, dense technical tables, or complicated controls.

---

# 1. Core Product Principles

The app should communicate three ideas:

## Know
See exactly how much electricity the whole house is using right now.

## Understand
See historical usage, estimated cost, peak demand, and simple consumption insights.

## Share
Share available energy with another registered Meter through the cloud.

The energy sharing feature should feel as simple as using a digital wallet or mobile hotspot, but technically it is **cloud synchronized only**.

There is:

- No Bluetooth pairing.
- No nearby device pairing.
- No local Wi-Fi Direct sharing.
- No offline sharing.
- No direct app-to-meter sharing.
- No local meter-to-meter pairing workflow.

The sharing architecture is:

**Meter A → Cloud Backend → Meter B**

The cloud validates both meters, creates the sharing session, synchronizes control commands, records transferred energy, and stops or suspends sharing if connectivity is lost.

Energy sharing is available only when both meters are online and connected to the cloud.

---

# 2. Navigation

Use four bottom navigation tabs:

**Home · Energy · Share · Settings**

Keep the navigation simple.

Do not add unnecessary tabs.

Notifications should be accessible using a bell icon in the top area.

---

# 3. Visual Design Direction

The app should have a premium **simple smart-home feel**.

Use:

- Clean white or neutral backgrounds.
- Rounded cards.
- Large readable typography.
- Simple line icons.
- Generous spacing.
- Minimal visual clutter.
- Subtle borders or shadows.
- Smooth transitions.
- One primary accent color.
- Clear success, warning, offline, and active states.
- Responsive mobile-first layout.
- Light mode and dark mode.

Important values such as power, energy, cost, and shared energy should use large typography.

Use proper electrical units:

- V
- A
- W
- kW
- kWh
- %
- ₦ or the selected currency

Avoid large analog gauges.

Prefer numeric values, small charts, progress bars, and simple status cards.

---

# 4. Onboarding

Create a clean first-time onboarding experience.

## Welcome Screen

Show:

**Meter**

Tagline:

**Know your energy. Understand your usage. Share when needed.**

Actions:

- Get Started
- Sign In

Keep this screen extremely minimal.

---

# 5. Authentication

Allow users to create an account using:

- Email
- Phone number
- Password

Include:

- Sign in
- Create account
- Forgot password
- Verification code screen
- Terms and privacy acknowledgement

For the prototype, authentication can use mock data, but structure the application so it can later connect to a real authentication service.

---

# 6. Add a Meter Device

After registration, allow the user to connect their physical Meter device.

Provide:

## Scan QR Code

The user scans a QR code printed on the Meter enclosure.

## Enter Meter ID

Example:

`MTR-8A24-19F2`

Then show:

**Connecting to your Meter...**

After success:

**Meter connected successfully**

Allow the user to give the meter a friendly name.

Examples:

- My Home
- Main House
- Apartment
- Shop
- Office

Also allow setup of:

- Currency
- Electricity tariff
- Timezone if needed

---

# 7. Home Screen

The Home screen is the most important screen in the application.

It should show the user the current whole-house energy situation immediately.

At the top show:

**Good afternoon**

Then:

**My Home**

with a small status indicator.

Example:

**Online**

---

# 8. Current Power Card

The largest card on the Home screen should display:

**Current Power**

Example:

# 2.46 kW

Supporting text:

**Your home is currently using 2.46 kW**

Optionally show:

- Normal usage
- Higher than usual
- Lower than usual

The number should update using simulated real-time data.

Do not use a large analog gauge.

---

# 9. Energy Today

Show:

**Energy Today**

Example:

**8.42 kWh**

Supporting comparison:

**12% less than yesterday**

or:

**18% more than yesterday**

Use simple language.

---

# 10. Estimated Cost Today

Show:

**Estimated Cost Today**

Example:

**₦1,263**

Supporting text:

**Based on ₦150/kWh**

Allow the user to tap for more billing details.

---

# 11. Live Electrical Data

Create a secondary card called:

**Live Electrical Data**

Show:

**Voltage**  
231 V

**Current**  
10.7 A

**Power Factor**  
0.96

Optional expandable values for future use:

- Frequency
- Apparent power
- Reactive power

Keep these secondary to the main power and cost information.

---

# 12. Grid Status

Provide a clear grid status section.

Possible states:

## Grid Online

**Grid Power Available**

## Grid Offline

**Power Outage**

Supporting text:

**Meter is operating on backup battery**

## Grid Restored

Temporary message:

**Grid power restored**

Use simple language rather than technical engineering terminology.

---

# 13. Backup Battery Status

The physical Meter contains a small lithium backup battery that keeps the monitoring and control electronics alive during a power outage.

Show:

**Meter Backup**

Example:

**82%**

Possible statuses:

- Charging
- On battery
- Battery low

Include explanatory text:

**Backup keeps your Meter connected during outages.**

Make it clear that this battery does not power the entire house.

---

# 14. Meter Connectivity

Show:

**Meter Online**

**Last updated: Just now**

Possible states:

- Online
- Offline
- Reconnecting
- Weak connection

If offline:

**Meter Offline**

**Last seen 4 minutes ago**

---

# 15. Home Energy Snapshot

Near the bottom of the Home screen, show a small graph for today's energy usage.

Timeline example:

12 AM → 6 AM → 12 PM → 6 PM → Now

Add:

**View full energy analytics**

which opens the Energy tab.

---

# 16. Quick Energy Sharing Card

Add a clear sharing card on Home.

If not sharing:

## Energy Sharing

**Not sharing**

Button:

**Share Energy**

If actively sharing:

**Sharing with Neighbour House**

**420 W currently**

**0.74 kWh transferred**

Button:

**View Session**

If receiving:

**Receiving from Family House**

**380 W currently**

Button:

**View Session**

---

# 17. Energy Screen

The Energy tab should explain whole-house energy use in a simple way.

At the top provide:

**Today · Week · Month**

Use a segmented control.

---

# 18. Today View

Show:

## Energy Used

**8.42 kWh**

## Estimated Cost

**₦1,263**

## Average Power

**1.12 kW**

## Peak Demand

**3.84 kW**

Then show an hourly consumption graph.

Add an insight such as:

**Highest usage was between 7 PM and 8 PM.**

---

# 19. Weekly View

Show:

**This Week**

Example:

**54.8 kWh**

Estimated cost:

**₦8,220**

Show a seven-day bar chart.

Add:

**You used 8% less electricity than last week.**

---

# 20. Monthly View

Show:

**August**

Example:

**214.6 kWh**

Estimated bill:

**₦32,190**

Also show:

**Projected monthly usage**  
246 kWh

**Projected bill**  
₦36,900

Clearly label projections as estimates.

---

# 21. Consumption Insights

Create an **Insights** section.

Use simple language such as:

- Your usage is lower than last week.
- Your highest consumption usually occurs in the evening.
- You have used 72% of your typical monthly energy.
- Energy usage increased significantly today at 6:40 PM.

For the prototype, these insights can use mock logic.

---

# 22. Energy Sharing — Core Rules

The Share tab is a major feature of Meter.

Important implementation rule:

**Energy sharing is cloud-only.**

There is no local pairing.

There is no discovery of nearby Bluetooth devices.

There is no offline sharing.

There is no direct local meter-to-meter app workflow.

The user selects another already-registered Meter through the cloud.

The cloud backend validates:

- Source Meter exists.
- Destination Meter exists.
- Source Meter is online.
- Destination Meter is online.
- Both meters are eligible for energy sharing.
- The requested power and energy limits are valid.

Only after validation should a sharing session start.

---

# 23. Share Screen — Idle State

At the top show:

# Energy Sharing

Description:

**Share available electricity with another Meter.**

Show:

**Cloud Status: Connected**

State:

**Ready to Share**

Primary button:

**Share Energy**

Below, show:

**Recent Recipients**

Examples:

- Neighbour House
- Family House
- Shop

Do not call them paired meters.

---

# 24. Select Recipient Meter

When the user taps Share Energy, open a recipient selection screen.

Allow:

## Search by Meter ID

Example:

`MTR-72AF-2091`

## Search by Account or Meter Name

Example:

`Neighbour House`

## Saved Recipients

Show previously used recipients.

The app should fetch registered meters from the cloud.

After selection, show:

**Neighbour House**

`MTR-72AF-2091`

**Online**

If unavailable:

**Offline**

**This Meter must be online to receive energy.**

Do not show any pairing process.

---

# 25. Sharing Configuration

After selecting the recipient, allow the user to configure sharing.

Show:

## Recipient

Neighbour House  
MTR-72AF-2091

## Energy Limit

Example:

**2.0 kWh**

The session stops after this amount has been transferred.

## Maximum Power

Example:

**500 W**

The recipient cannot receive more than this power from the sharing session.

## Duration

Example:

**1 hour**

The session automatically ends after the selected duration.

Allow the user to use one or more limits.

---

# 26. Quick Sharing Presets

Provide simple presets.

## Duration

- 30 minutes
- 1 hour
- 2 hours
- Custom

## Energy Limit

- 0.5 kWh
- 1 kWh
- 2 kWh
- Custom

## Power Limit

- 250 W
- 500 W
- 1 kW
- Custom

The exact limits can later be constrained by hardware and backend rules.

---

# 27. Start Sharing Confirmation

Before starting a session, show:

# Ready to Share

**To:** Neighbour House

**Maximum Energy:** 2.0 kWh

**Maximum Power:** 500 W

**Duration:** 1 hour

**Cloud Sync:** Ready

Primary button:

**Start Energy Sharing**

Secondary button:

**Cancel**

When the user presses Start, the backend should validate both meters again.

---

# 28. Active Sharing Screen

When sharing starts, show:

**Sharing Active**

**Neighbour House**

Prominently display:

# 420 W

**Currently being shared**

Then:

**0.74 / 2.00 kWh**

Energy transferred

**32 min**

Elapsed

**28 min**

Remaining

**Cloud Sync**

**Live**

Show a clean progress bar.

Provide:

**Stop Sharing**

as a prominent action.

---

# 29. Sharing Progress

Depending on active limits, show:

## Energy Limit

**0.74 / 2.00 kWh**

## Duration

**32 / 60 minutes**

## Power Limit

**420 W / 500 W maximum**

The UI should make it easy to understand the current session at a glance.

---

# 30. Stop Sharing

When the user taps Stop Sharing, show:

# Stop Energy Sharing?

**Neighbour House will stop receiving energy from your Meter.**

Buttons:

- Stop Sharing
- Continue Sharing

After stopping, show:

# Sharing Completed

**1.42 kWh transferred**

**Duration: 48 minutes**

**Recipient: Neighbour House**

Button:

**Done**

Save the session to sharing history.

---

# 31. Receiving Energy

If another Meter shares energy with the user's Meter through the cloud, show:

# Receiving Energy

**From Family House**

Prominently display:

# 380 W

**Currently receiving**

Then:

**0.62 kWh**

Received so far

**Cloud Sync**

**Live**

Provide a button:

**Stop Receiving**

if allowed by backend rules.

---

# 32. Cloud-Only Availability Rules

Sharing must never work offline.

If the source Meter is offline:

**Sharing unavailable**

**Your Meter must be online to share energy.**

If the recipient Meter is offline:

**Recipient unavailable**

**This Meter must be online to receive energy.**

If cloud connectivity is lost before sharing starts:

**Unable to start sharing**

**Cloud connection is required.**

If cloud connectivity is lost during an active session:

**Sharing interrupted**

**Cloud connection was lost. The session has been stopped for safety.**

If the recipient disconnects:

**Recipient disconnected**

**Energy sharing has been stopped.**

---

# 33. Sharing States

Support these clear states:

- Ready
- Validating
- Starting
- Active
- Receiving
- Paused
- Completed
- Cancelled
- Failed
- Offline
- Connection lost
- Energy limit reached
- Time limit reached
- Protection stopped

Use short labels and clear icons.

---

# 34. Sharing History

Inside the Share tab, provide a **History** section.

Example:

## Neighbour House

14 Aug, 7:32 PM

**1.42 kWh shared**

48 min

**Completed**

Example:

## Family House

12 Aug, 4:10 PM

**0.86 kWh received**

32 min

**Completed**

Users should be able to tap a session for full details.

---

# 35. Sharing Session Details

Show:

- Session ID
- Source Meter
- Destination Meter
- Date
- Start time
- End time
- Duration
- Energy transferred
- Average power
- Maximum power
- Energy limit
- Cloud sync status
- Session result

Keep Session ID and advanced technical details under an expandable section.

---

# 36. Notifications

Create a notification center accessible from a bell icon.

Support:

## Grid Outage

**Grid power was lost at 8:42 PM.**

## Grid Restored

**Grid power was restored after 14 minutes.**

## High Consumption

**Your home is currently using more energy than usual.**

## Meter Offline

**My Home Meter has lost its internet connection.**

## Battery Low

**Meter backup battery is below 20%.**

## Sharing Started

**Energy sharing with Neighbour House has started.**

## Sharing Completed

**2.0 kWh was successfully shared with Neighbour House.**

## Receiving Started

**Your Meter is receiving energy from Family House.**

## Sharing Interrupted

**Energy sharing stopped because cloud connectivity was lost.**

---

# 37. Settings Screen

Create a clean settings page.

## My Meter

- Meter name
- Meter ID
- Device status
- Firmware version

## Electricity

- Tariff
- Currency
- Billing cycle

## Energy Sharing

- Default power limit
- Default energy limit
- Default duration
- Saved recipients
- Sharing permissions

## Notifications

Allow toggling:

- Grid outage
- Grid restored
- High usage
- Meter offline
- Battery low
- Sharing started
- Sharing completed
- Receiving started
- Sharing interrupted

## Account

- Profile
- Email
- Phone
- Password
- Sign out

## Appearance

- Light
- Dark
- System

---

# 38. Meter Device Details

Create a dedicated device screen.

Example:

# My Home

**Online**

**Meter ID**  
MTR-8A24-19F2

**Grid**  
Online

**Connection**  
Good

**Backup Battery**  
82% · Charging

**Firmware**  
v1.0.4

**Last Sync**  
Just now

Also include:

- Refresh status
- Check connection
- Firmware information

---

# 39. Optional Whole-House Supply Control

If supported by the final hardware, include an optional whole-house disconnect control.

Do not place it prominently on Home.

Place it inside the device details screen.

Example:

## Main Supply

**Connected**

Button:

**Disconnect House Supply**

Require strong confirmation.

Example:

**Disconnect electricity supply to this property?**

Use:

**Press and hold to disconnect**

to reduce accidental actions.

---

# 40. Backend-Ready Meter Data Model

Structure the prototype so hard-coded mock data can later be replaced by backend data.

A Meter device should conceptually include:

```text
meter_id
meter_name
user_id

voltage
current
active_power
power_factor

energy_today
energy_week
energy_month
total_energy

estimated_cost_today
estimated_bill

grid_status
device_status
connection_status

battery_percentage
battery_status

last_seen
timestamp
```

---

# 41. Sharing Data Model

Each cloud sharing session should conceptually contain:

```text
session_id

source_meter_id
destination_meter_id

status

power_limit_w
energy_limit_kwh
duration_limit_seconds

current_power_w
energy_transferred_kwh

started_at
ended_at

source_online
destination_online

cloud_sync_status
direction
```

Possible direction values:

```text
sending
receiving
```

Possible status values:

```text
validating
starting
active
paused
completed
cancelled
failed
offline
connection_lost
energy_limit_reached
time_limit_reached
protection_stopped
```

---

# 42. Future API Structure

Organize the frontend service layer so mock services can later be replaced by real APIs.

Conceptual endpoints:

```text
GET /meters/{meterId}/live
GET /meters/{meterId}/energy
GET /meters/{meterId}/status

GET /meters/search
GET /meters/{meterId}

POST /sharing/start
POST /sharing/stop

GET /sharing/active
GET /sharing/history
GET /sharing/{sessionId}
```

For the first prototype, create mock service functions that imitate these endpoints.

---

# 43. Real-Time Mock Behaviour

Simulate realistic live values.

Current power can move gradually:

```text
1.84 kW
1.92 kW
2.06 kW
1.77 kW
```

Voltage can vary around:

```text
228–235 V
```

Power factor can typically display around:

```text
0.91–0.99
```

Do not make values change dramatically every second.

Use smooth updates.

---

# 44. Default Mock Household Data

Use realistic sample data throughout the prototype.

```text
Current Power: 2.46 kW
Voltage: 231 V
Current: 10.7 A
Power Factor: 0.96
Energy Today: 8.42 kWh
Estimated Cost Today: ₦1,263
Grid: Online
Meter Battery: 82%
Meter Status: Online
```

---

# 45. Default Mock Sharing Data

Example active sharing session:

```text
Recipient: Neighbour House
Recipient Meter: MTR-72AF-2091

Current Power: 420 W
Maximum Power: 500 W

Transferred: 0.74 kWh
Energy Limit: 2.00 kWh

Elapsed: 32 minutes
Duration Limit: 1 hour

Cloud Sync: Live
```

Example receiving session:

```text
Source: Family House
Source Meter: MTR-34BC-9821

Receiving Power: 380 W
Energy Received: 0.62 kWh

Cloud Sync: Live
```

---

# 46. Empty States

Create polished empty states.

## No Energy History

**Your energy history will appear here once Meter starts collecting data.**

## No Recent Recipients

**No recent recipients**

**Search for a registered Meter to start sharing energy.**

Button:

**Share Energy**

## No Sharing History

**No sharing sessions yet**

**Your previous energy transfers will appear here.**

---

# 47. Offline Behaviour

If the Meter loses internet connectivity:

Show:

# Meter Offline

**Live readings are temporarily unavailable.**

**Last reading: 2.14 kW**

**Last updated: 8 minutes ago**

Historical energy data should remain visible if cached.

Energy sharing controls must be disabled.

Show:

**Energy sharing requires a cloud connection.**

Do not allow the user to start or continue a new sharing session while offline.

---

# 48. Loading States

Use skeleton cards rather than large spinners where possible.

Examples:

- Loading current power
- Loading energy graph
- Searching registered Meters
- Validating recipient
- Starting sharing session
- Loading history

---

# 49. Error Handling

Use simple user-friendly messages.

Instead of:

**API Error 503**

show:

**We couldn't reach your Meter.**

**Check your connection and try again.**

Instead of:

**Session initialization failed**

show:

**Energy sharing couldn't start. Please try again.**

Instead of:

**Recipient websocket disconnected**

show:

**The receiving Meter went offline. Sharing has been stopped.**

Technical diagnostics can exist later but should not appear in the normal user interface.

---

# 50. Component Structure

Build reusable components.

Suggested components:

```text
AppHeader
BottomNavigation
StatusBadge
MetricCard
CurrentPowerCard
EnergySummaryCard
ElectricalDataCard
BatteryStatusCard
GridStatusCard
ConnectivityCard
EnergyChart
InsightCard
ShareStatusCard
RecipientSearch
RecipientCard
ShareConfiguration
ShareProgress
CloudSyncBadge
SharingHistoryCard
NotificationItem
SettingRow
EmptyState
OfflineBanner
ConfirmationModal
LoadingSkeleton
```

---

# 51. Suggested App Routes

Use a clean route structure.

```text
/
 /welcome
 /login
 /register

 /setup-meter

 /home

 /energy
 /energy/today
 /energy/week
 /energy/month

 /share
 /share/select-recipient
 /share/configure
 /share/active
 /share/receiving
 /share/history
 /share/session/:id

 /notifications

 /settings
 /settings/meter
 /settings/electricity
 /settings/sharing
 /settings/notifications
 /settings/account
 /settings/appearance
```

---

# 52. Prototype Build Order

Build the application in this order:

1. App shell and design system.
2. Bottom navigation.
3. Home screen.
4. Energy analytics screens.
5. Share screen.
6. Recipient search by cloud Meter ID/name.
7. Sharing configuration.
8. Active sharing state.
9. Receiving state.
10. Sharing history.
11. Settings.
12. Notifications.
13. Device detail screen.
14. Offline states.
15. Loading and error states.
16. Mock real-time updates.
17. Replace mock service layer with real cloud API later.

Do not connect the ESP32 directly during the first UI prototype.

First make the entire app experience work using mock data.

---

# 53. Technical Architecture Assumption

The final system architecture is:

```text
Whole-House Electrical Supply
        ↓
Physical Meter Hardware
        ↓
ESP32 + Energy Metering Hardware
        ↓
Internet
        ↓
Cloud Backend / Database
        ↓
Mobile App
```

For sharing:

```text
Meter A
   ↓
Cloud Backend
   ↓
Meter B
```

The mobile app interacts with the cloud backend.

The cloud backend handles:

- Meter registration.
- Live telemetry.
- Historical energy data.
- User authentication.
- Recipient Meter lookup.
- Sharing authorization.
- Sharing session control.
- Session state.
- Transfer history.
- Notifications.

The physical Meter should never depend on direct phone connectivity for normal operation.

---

# 54. Important Sharing Requirement

Treat this as a strict product requirement:

> **Energy sharing must only operate while both source and destination meters are online and synchronized with the cloud.**

Do not create offline sharing flows.

Do not create Bluetooth pairing flows.

Do not create local device discovery.

Do not create a nearby-meter pairing step.

Do not refer to meters as paired devices.

Use terms such as:

- Registered Meter
- Recipient Meter
- Saved Recipient
- Source Meter
- Destination Meter
- Online Meter

---

# 55. Final Product Feel

The finished prototype should feel like a polished consumer product rather than a student engineering dashboard.

A normal user should be able to:

1. Open Meter.
2. See how much power their house is using.
3. See how much energy they have consumed.
4. See approximately how much it costs.
5. Know whether grid power and their Meter are online.
6. View their usage history.
7. Search for another registered Meter.
8. Set a sharing limit.
9. Start cloud-synchronized energy sharing.
10. See exactly how much energy is being shared.
11. Stop the session.
12. Review previous energy-sharing sessions.

The interface should always prioritize clarity, trust, and simplicity.
