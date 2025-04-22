# 🌦️ Weather API Backend - CSCI3916-Project

This is a full-featured backend REST API for managing user accounts and weather data, including integration with OpenWeatherMap for real-time weather updates. Built with Node.js, Express, MongoDB, and JWT authentication.

---

## 🚀 Features

- 🔐 User Registration & JWT Login
- 📥 Save mock weather entries to MongoDB
- 📤 Fetch historical weather logs
- ☁️ Live city weather using OpenWeatherMap API
- 🛡️ Secure endpoints with JWT
- 🌍 MongoDB Atlas cloud integration
- 🧪 Tested with Postman

---

## 🔧 Technologies

- Node.js
- Express.js
- MongoDB + Mongoose
- JWT + Passport.js
- Axios (for weather API)
- Render (deployment)

---

## 🛠️ Setup Instructions

### 1. Clone & Install
```bash
git clone https://github.com/MOONKYU401/CSCI3916-Project-backend.git
cd weather-api-backend
npm install
```

### Postman Collection Link:
[<img src="https://run.pstmn.io/button.svg" alt="Run In Postman" style="width: 128px; height: 32px;">](https://god.gw.postman.com/run-collection/41685866-2408eecd-656d-4175-aec4-c179504cbefa?action=collection%2Ffork&source=rip_markdown&collection-url=entityId%3D41685866-2408eecd-656d-4175-aec4-c179504cbefa%26entityType%3Dcollection%26workspaceId%3Dba4562bc-f61e-4909-bd71-1d21940ccd2d#?env%5BtheSunny3%5D=W3sia2V5IjoiYmFzZV91cmwiLCJ2YWx1ZSI6Imh0dHBzOi8vd2VhdGhlci1hcGktd2tzaS5vbnJlbmRlci5jb20iLCJlbmFibGVkIjp0cnVlLCJ0eXBlIjoiZGVmYXVsdCIsInNlc3Npb25WYWx1ZSI6Imh0dHBzOi8vd2VhdGhlci1hcGktd2tzaS5vbnJlbmRlci5jb20iLCJjb21wbGV0ZVNlc3Npb25WYWx1ZSI6Imh0dHBzOi8vd2VhdGhlci1hcGktd2tzaS5vbnJlbmRlci5jb20iLCJzZXNzaW9uSW5kZXgiOjB9LHsia2V5Ijoiand0X3Rva2VuIiwidmFsdWUiOiJ7e2p3dF90b2tlbn19IiwiZW5hYmxlZCI6dHJ1ZSwidHlwZSI6ImRlZmF1bHQiLCJzZXNzaW9uVmFsdWUiOiJKV1QuLi4iLCJjb21wbGV0ZVNlc3Npb25WYWx1ZSI6IkpXVCBleUpoYkdjaU9pSklVekkxTmlJc0luUjVjQ0k2SWtwWFZDSjkuZXlKcFpDSTZJalk0TURaak4yUmpaVFkyWVRWbVl6UmlOekF6TW1Ka09DSXNJblZ6WlhKdVlXMWxJam9pZEdWemRIVnpaWElpTENKcFlYUWlPakUzTkRVeU56Z3hNeko5LkpZYThoeTFhNHB6TGxrRmdNRzJEWU01Y3l2Q3owMk9BQkl2VkJQdU80dDgiLCJzZXNzaW9uSW5kZXgiOjF9LHsia2V5IjoidXNlcm5hbWUiLCJ2YWx1ZSI6IiIsImVuYWJsZWQiOnRydWUsInR5cGUiOiJhbnkiLCJzZXNzaW9uVmFsdWUiOiJ0ZXN0dXNlciIsImNvbXBsZXRlU2Vzc2lvblZhbHVlIjoidGVzdHVzZXIiLCJzZXNzaW9uSW5kZXgiOjJ9LHsia2V5IjoicGFzc3dvcmQiLCJ2YWx1ZSI6IiIsImVuYWJsZWQiOnRydWUsInR5cGUiOiJhbnkiLCJzZXNzaW9uVmFsdWUiOiJ0ZXN0cGFzcyIsImNvbXBsZXRlU2Vzc2lvblZhbHVlIjoidGVzdHBhc3MiLCJzZXNzaW9uSW5kZXgiOjN9XQ==)