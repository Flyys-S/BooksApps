export function generateStaticParams() {
  return [
    { username: "me" }
  ];
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
