export const runtime = 'edge';

export default function AboutPage() {
    return (
        <div className="max-w-3xl mx-auto py-16 px-6 sm:py-24">
            <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 mb-8">About Us</h1>
            <div className="prose prose-lg text-gray-700">
                <p>PyuNovel is a premium platform for reading and publishing amazing stories from talented authors.</p>
                <p>Our mission is to connect readers with the epic worlds crafted by our amazing writers.</p>
                <h2>For Readers</h2>
                <p>Enjoy thousands of high-quality novels across various genres. Our seamless reading experience is designed with you in mind.</p>
                <h2>For Writers</h2>
                <p>Start your writing journey today. We provide the tools you need to publish, manage, and share your stories with the world.</p>
            </div>
        </div>
    );
}
