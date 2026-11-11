import { MockDataProvider } from "@/features/shared/mock-data-provider";

export default function StaffLayout({ children }: { children: React.ReactNode }) {
  return <MockDataProvider>{children}</MockDataProvider>;
}
