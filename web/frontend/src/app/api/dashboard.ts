export async function fetchDashboardData() {
  const response = await fetch("http://localhost:3000/api/sensor-data/0b2cf30c-d327-475b-b729-e5aab906b9d0");

  if (!response.ok) {
    throw new Error("Failed to fetch dashboard data");
  }

  return response.json();
}



// 0b2cf30c-d327-475b-b729-e5aab906b9d0