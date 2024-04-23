import AddressForm from "@/components/AddressForm";
import { NextUIProvider } from "@nextui-org/react";

export default function Home() {
  return (
    <NextUIProvider>
      <main className="dark flex min-h-screen flex-col items-center p-6">
        <h1 className="text-4xl py-4">Whats Closer?</h1>
        <AddressForm />
      </main>
    </NextUIProvider>
  );
}
