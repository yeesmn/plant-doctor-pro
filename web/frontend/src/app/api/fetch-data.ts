import { supabase } from "../../supabase/supabase";

export async function fetchDashboardData() {
  // const response = await fetch("http://localhost:3000/api/sensor-data/0b2cf30c-d327-475b-b729-e5aab906b9d0");

  // if (!response.ok) {
  //   throw new Error("Failed to fetch dashboard data");
  // }

  // return response.json();
  const { data, error } = await supabase
    .from('devices')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error(error);
    return {data: null};
  }

  console.info(data);

  return {data} as {data: any[]};

}



// 0b2cf30c-d327-475b-b729-e5aab906b9d0

// ts// READ
// const { data, error } = await supabase
//   .from('plant_data')
//   .select('*')

// // CREATE
// const { data, error } = await supabase
//   .from('plant_data')
//   .insert([{ moisture: 450, temperature: 22.5 }])

// // UPDATE
// const { data, error } = await supabase
//   .from('plant_data')
//   .update({ moisture: 500 })
//   .eq('id', 1)

// // DELETE
// const { data, error } = await supabase
//   .from('plant_data')
//   .delete()
//   .eq('id', 1)