import AccountLayout from '@/components/account/AccountLayout';

export default function AccountRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AccountLayout>{children}</AccountLayout>;
}
