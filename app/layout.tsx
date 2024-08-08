import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./styles/globals.css";
import "./styles/main.scss";
import { MainLayout } from "./Components/Shared/MainLayout";
import { AntdRegistry } from '@ant-design/nextjs-registry';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "APG | System",
  description: "ERP Software",
};

export default function RootLayout({ children }: Readonly<{children: React.ReactNode;}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AntdRegistry>
          <MainLayout>
            {children}
          </MainLayout>
        </AntdRegistry>
      </body>
    </html>
  );
}