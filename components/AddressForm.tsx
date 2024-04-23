"use client";
import { FormEvent, useState } from "react";
import { Loader2 } from "lucide-react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  useDisclosure,
} from "@nextui-org/react";

type AddressWithCoordinates = {
  address: string;
  lat: number;
  lng: number;
  distance?: number;
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function extractAddresses(text: string): string[] {
  return text.split("\n").filter((line) => line.trim() !== "");
}

function haversineDistance(
  coords1: { lat: number; lng: number },
  coords2: { lat: number; lng: number },
  isMiles = false
) {
  function toRad(x: number) {
    return (x * Math.PI) / 180;
  }

  const R = 6371; // Earth radius in kilometers
  const dLat = toRad(coords2.lat - coords1.lat);
  const dLon = toRad(coords2.lng - coords1.lng);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(coords1.lat)) *
      Math.cos(toRad(coords2.lat)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  let d = R * c;

  if (isMiles) d /= 1.60934; // convert to miles

  return d;
}

function rankAddressesByProximity(
  startCoords: { address: string; lat: number; lng: number },
  addressCoords: Array<{ address: string; lat: number; lng: number }>
): AddressWithCoordinates[] {
  return addressCoords
    .map((coord: AddressWithCoordinates) => ({
      ...coord,
      distance: haversineDistance(startCoords, coord),
    }))
    .sort((a, b) => a.distance - b.distance);
}

const geocodeAddress = async (address: string) => {
  const response = await fetch("/api/geocode", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      address,
    }),
  });
  const data = await response.json();
  return data;
};

export default function AddressForm() {
  const [startingLocation, setStartingLocation] = useState<string>("");
  const [addressesText, setAddressesText] = useState<string>("");
  const [rankedAddresses, setRankedAddresses] = useState<
    AddressWithCoordinates[]
  >([]);
  const [terminalLogs, setTerminalLogs] = useState<AddressWithCoordinates[]>(
    []
  );
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { isOpen, onOpen, onOpenChange } = useDisclosure();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setTerminalLogs([]);
    setRankedAddresses([]);
    setIsLoading(true);

    // Geocode starting location
    const startingLocationCoordinates = await geocodeAddress(startingLocation);
    setTerminalLogs((prev) => [...prev, startingLocationCoordinates]);

    // Extract addresses from text
    const addressesExtracted = extractAddresses(addressesText);

    // Geocode each address
    const extractedAddressesWithCoordinates = [];
    for (const extractedAddress of addressesExtracted) {
      const data = await geocodeAddress(extractedAddress);

      setTerminalLogs((prev) => [...prev, data]);
      extractedAddressesWithCoordinates.push(data);

      await sleep(1000);
    }

    setIsLoading(false);

    // Find closest address
    const rankedAddresses = rankAddressesByProximity(
      startingLocationCoordinates,
      extractedAddressesWithCoordinates
    );

    setRankedAddresses(rankedAddresses);

    onOpen();
  };

  return (
    <div className="max-w-xl mx-auto p-4 w-full">
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label
            htmlFor="starting-location"
            className="block text-sm font-medium"
          >
            Starting Location:
          </label>
          <input
            type="text"
            id="starting-location"
            value={startingLocation}
            onChange={(e) => setStartingLocation(e.target.value)}
            required
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
        <div className="mb-4">
          <label htmlFor="addresses" className="block text-sm font-medium ">
            Addresses (one per line):
          </label>
          <textarea
            id="addresses"
            value={addressesText}
            onChange={(e) => setAddressesText(e.target.value)}
            required
            rows={10}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          ></textarea>
        </div>
        <button
          type="submit"
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            "Find Closest Address"
          )}
        </button>
      </form>

      {terminalLogs.length > 0 && (
        <div className="bg-gray-800 p-4 font-mono text-sm rounded-lg shadow-lg mt-4">
          {terminalLogs.map((address, index) => (
            <div key={address.address + index} className="mb-2 last:mb-0">
              <h2 className="text-lg text-green-400">{address.address}</h2>
              <p className="text-opacity-80">Latitude: {address.lat}</p>
              <p className="text-opacity-80">Longitude: {address.lng}</p>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">Results</ModalHeader>
              <ModalBody>
                {rankedAddresses.length > 0 ? (
                  <div className="font-mono text-sm rounded-xl shadow-2xl">
                    {rankedAddresses.map((address, index) => (
                      <div
                        key={address.address + index}
                        className={`mb-4 last:mb-0 p-3 rounded-lg ${
                          index === 0
                            ? "bg-yellow-400"
                            : index === 1
                            ? "bg-gray-400"
                            : "bg-red-500"
                        }`}
                      >
                        <h2
                          className={`text-xl font-bold ${
                            index === 0 ? "text-white" : "text-gray-900"
                          }`}
                        >
                          #{index + 1} {address.address}
                        </h2>
                        <p className="text-white">Latitude: {address.lat}</p>
                        <p className="text-white">Longitude: {address.lng}</p>
                        <p className="text-white">
                          Distance: {address.distance} km
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p>No results found</p>
                )}
              </ModalBody>
              <ModalFooter>
                <Button color="danger" variant="light" onPress={onClose}>
                  Close
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}
