import { MobileHomeScreen } from "@/components/ai-mobile/MobileHomeScreen";

export default function Page() {
  return (
    <main className="min-h-screen bg-[#F6F7FB]">
      <div className="mx-auto max-w-7xl lg:px-8">
        <div className="lg:flex lg:justify-center">
          <div className="w-full max-w-md lg:max-w-5xl">
            <MobileHomeScreen />
          </div>
        </div>
      </div>
    </main>
  );
}
