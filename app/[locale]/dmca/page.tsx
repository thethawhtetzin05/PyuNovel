export const runtime = 'edge';

export default function DMCAPage() {
    return (
        <div className="max-w-3xl mx-auto py-16 px-6 sm:py-24">
            <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 mb-8" style={{ color: "var(--foreground)" }}>DMCA Notice</h1>
            <div className="prose prose-lg" style={{ color: "var(--text-muted)" }}>
                <p>PyuNovel respects the intellectual property rights of others and expects its users to do the same. In accordance with the Digital Millennium Copyright Act (DMCA), we will respond expeditiously to claims of copyright infringement committed using the PyuNovel service.</p>
                
                <h2 style={{ color: "var(--foreground)" }}>Notice of Copyright Infringement</h2>
                <p>If you are a copyright owner, authorized to act on behalf of one, or authorized to act under any exclusive right under copyright, please report alleged copyright infringements taking place on or through the site by completing a Notice of Alleged Infringement and delivering it to our designated Copyright Agent.</p>
                
                <h2 style={{ color: "var(--foreground)" }}>Reporting Alleged Infringement</h2>
                <p>To be effective, the notification must be a written communication that includes the following:</p>
                <ul className="list-disc pl-6 space-y-2">
                    <li>A physical or electronic signature of a person authorized to act on behalf of the owner of an exclusive right that is allegedly infringed.</li>
                    <li>Identification of the copyrighted work claimed to have been infringed.</li>
                    <li>Identification of the material that is claimed to be infringing or to be the subject of infringing activity and that is to be removed or access to which is to be disabled.</li>
                    <li>Information reasonably sufficient to permit us to contact you, such as an address, telephone number, and, if available, an electronic mail address at which you may be contacted.</li>
                    <li>A statement that you have a good faith belief that use of the material in the manner complained of is not authorized by the copyright owner, its agent, or the law.</li>
                    <li>A statement that the information in the notification is accurate, and under penalty of perjury, that you are authorized to act on behalf of the owner of an exclusive right that is allegedly infringed.</li>
                </ul>

                <h2 style={{ color: "var(--foreground)" }}>Contact Information</h2>
                <p>Please send all DMCA notices to: <a href="mailto:admin@pyunovel.com" className="text-primary hover:underline">admin@pyunovel.com</a></p>
            </div>
        </div>
    );
}
