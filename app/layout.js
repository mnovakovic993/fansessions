import './globals.css';

export const metadata = {
  title: 'Fan Sessions',
  description: 'Paid 1:1 video calls between creators and fans, booked and paid on Fanvue.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
