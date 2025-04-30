# 🌦️ CSCI 3916 Final Project — Weather API Backend

This is a Node.js + Express backend API for managing user accounts and tracking weather search results. Users can register, sign in, and view current weather via the OpenWeatherMap API. All search results are saved in MongoDB under the `csci3916_final_project` database.

---

## 🚀 Features

- 🔐 JWT-based user authentication
- 🌤️ Fetch live weather on login using default or specified city
- 🔍 Search live weather by city, state, and country
- 🗃️ MongoDB logging of search results per user
- 📜 View user weather history
- 🛡️ Secure routes with Passport JWT
- 🩺 `/health` route for monitoring

---

## 🧰 Tech Stack

- Node.js + Express.js
- MongoDB Atlas (cloud)
- Mongoose ODM
- OpenWeatherMap API
- Postman for API testing
- Deployed using Render

---

## 🔧 Installation

1. **Clone the repo**
```bash
git clone https://github.com/yourusername/weather-api-backend.git
cd weather-api-backend
```

### Postman Collection Link:
[<img src="https://run.pstmn.io/button.svg" alt="Run In Postman" style="width: 128px; height: 32px;">](https://god.gw.postman.com/run-collection/41685866-2408eecd-656d-4175-aec4-c179504cbefa?action=collection%2Ffork&source=rip_markdown&collection-url=entityId%3D41685866-2408eecd-656d-4175-aec4-c179504cbefa%26entityType%3Dcollection%26workspaceId%3Dba4562bc-f61e-4909-bd71-1d21940ccd2d#?env%5BtheSunny3%5D=W3sia2V5IjoiYmFzZV91cmwiLCJ2YWx1ZSI6Imh0dHBzOi8vd2VhdGhlci1hcGktd2tzaS5vbnJlbmRlci5jb20iLCJlbmFibGVkIjp0cnVlLCJ0eXBlIjoiZGVmYXVsdCIsInNlc3Npb25WYWx1ZSI6Imh0dHBzOi8vd2VhdGhlci1hcGktd2tzaS5vbnJlbmRlci5jb20iLCJjb21wbGV0ZVNlc3Npb25WYWx1ZSI6Imh0dHBzOi8vd2VhdGhlci1hcGktd2tzaS5vbnJlbmRlci5jb20iLCJzZXNzaW9uSW5kZXgiOjB9LHsia2V5Ijoiand0X3Rva2VuIiwidmFsdWUiOiJ7e2p3dF90b2tlbn19IiwiZW5hYmxlZCI6dHJ1ZSwidHlwZSI6ImRlZmF1bHQiLCJzZXNzaW9uVmFsdWUiOiJKV1QuLi4iLCJjb21wbGV0ZVNlc3Npb25WYWx1ZSI6IkpXVCBleUpoYkdjaU9pSklVekkxTmlJc0luUjVjQ0k2SWtwWFZDSjkuZXlKcFpDSTZJalk0TUdGalpUQTNOVEZsTVdGaE1XSXhZMkpoWkdJelpTSXNJbWxoZENJNk1UYzBOakF3TURNM01IMC43bXQxT2I0Z2ZPRzBsWGJsRTd0Rkd6TXMzOUFXNWJfeWN1SU5tWG1xZDNVIiwic2Vzc2lvbkluZGV4IjoxfSx7ImtleSI6InVzZXJuYW1lIiwidmFsdWUiOiIiLCJlbmFibGVkIjp0cnVlLCJ0eXBlIjoiYW55Iiwic2Vzc2lvblZhbHVlIjoidGVzdHVzZXIiLCJjb21wbGV0ZVNlc3Npb25WYWx1ZSI6InRlc3R1c2VyIiwic2Vzc2lvbkluZGV4IjoyfSx7ImtleSI6InBhc3N3b3JkIiwidmFsdWUiOiIiLCJlbmFibGVkIjp0cnVlLCJ0eXBlIjoiYW55Iiwic2Vzc2lvblZhbHVlIjoidGVzdHBhc3MiLCJjb21wbGV0ZVNlc3Npb25WYWx1ZSI6InRlc3RwYXNzIiwic2Vzc2lvbkluZGV4IjozfV0=)