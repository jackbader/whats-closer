import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "POST") {
    const { address } = req.body;

    if (!address) {
      res.status(400).json({ error: "Address is required" });
      return;
    }

    const coordinates = await geocodeAddress(address);

    res.status(200).json({ address, ...coordinates });
  } else {
    res.setHeader("Allow", ["POST"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

async function geocodeAddress(
  address: string
): Promise<{ lat: number; lng: number }> {
  const apiKey = process.env.OPENCAGE_API_KEY; // Use directly if client-side is necessary

  const response = await fetch(
    `https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(
      address
    )}&key=${apiKey}`
  );

  const data = await response.json();
  const results = data.results;
  console.log("results from api", results);
  const firstResult = results[0];
  console.log("first result", firstResult);
  const geometry = firstResult.geometry;
  console.log("gemoetry", geometry);
  return geometry;
}
