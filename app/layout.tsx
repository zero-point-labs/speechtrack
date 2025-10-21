import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Κέντρο Ειδικών Θεραπειών Μαριλένα Νέστωρος - Λογοπαθολόγος/Λογοθεραπεύτρια",
  description: "Πλατφόρμα συνεργασίας για λογοθεραπευτές και γονείς. Παρακολουθήστε την πρόοδο, οργανώστε συνεδρίες και βελτιώστε τα αποτελέσματα της θεραπείας.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="el">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning={true}
      >
        {children}
      </body>
    </html>
  );
}
