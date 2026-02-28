export const runtime = 'edge';

export default function PrivacyPage() {
    return (
        <div className="max-w-3xl mx-auto py-16 px-6 sm:py-24">
            <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 mb-8">Privacy Policy</h1>
            <div className="prose prose-lg text-gray-700">
                <p>Your privacy is important to us. This policy outlines how we collect, use, and protect your information.</p>
                <h2>Information We Collect</h2>
                <p>When you register, we collect your email address, name, and profile information to provide our services.</p>
                <h2>How We Use Information</h2>
                <p>We use your information to manage your account, secure your sessions, and provide you with personalized reading and writing experiences.</p>
                <h2>Cookies</h2>
                <p>We use essential cookies to maintain your login session and preferences (e.g., dark mode).</p>
            </div>
        </div>
    );
}
