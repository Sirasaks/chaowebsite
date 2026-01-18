import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'โปรไฟล์ของฉัน',
};

export default function Layout({ children }: { children: React.ReactNode }) {
    return children;
}
