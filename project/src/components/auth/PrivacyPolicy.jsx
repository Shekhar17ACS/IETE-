import React from 'react';

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-gray-100 flex justify-center py-10">
      <div className="max-w-3xl w-full bg-white p-8 rounded-lg shadow-lg">
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-6">
          Privacy Policy
        </h1>
        <p className="text-gray-700 mb-4">
          <strong>THE INSTITUTION OF ELECTRONICS AND TELECOMMUNICATION ENGINEERS (IETE)</strong><br />
          (Recognised by DSIR, Government of India)
        </p>
        <p className="text-gray-700 mb-6">
          The Institution of Electronics and Telecommunication Engineers (IETE) is committed to protecting the privacy of our members, users, and visitors. This Privacy Policy outlines how we collect, use, disclose, and safeguard your personal information when you interact with our website, services, or events. By using our services, you consent to the practices described in this policy.
        </p>

        <h2 className="text-2xl font-semibold text-gray-800 mt-6 mb-4">1. Information We Collect</h2>
        <p className="text-gray-700 mb-2">1.1 <strong>Personal Information:</strong> We may collect personal information such as your name, email address, mobile number, mailing address, and professional details when you register for membership, attend events, or interact with our website.</p>
        <p className="text-gray-700 mb-2">1.2 <strong>Non-Personal Information:</strong> We may collect non-identifiable information such as browser type, IP address, and usage data to improve our website and services.</p>
        <p className="text-gray-700 mb-2">1.3 <strong>Payment Information:</strong> For membership fees or event registrations, we collect payment details through secure third-party payment processors. IETE does not store your credit card or bank account information.</p>

        <h2 className="text-2xl font-semibold text-gray-800 mt-6 mb-4">2. How We Use Your Information</h2>
        <p className="text-gray-700 mb-2">2.1 To provide and manage membership services, including access to resources, journals, and events.</p>
        <p className="text-gray-700 mb-2">2.2 To communicate with you about IETE activities, updates, and promotional offers (you may opt out of marketing communications).</p>
        <p className="text-gray-700 mb-2">2.3 To process payments and fulfill service requests.</p>
        <p className="text-gray-700 mb-2">2.4 To analyze website usage and improve our services.</p>
        <p className="text-gray-700 mb-2">2.5 To comply with legal obligations and protect IETE’s rights.</p>

        <h2 className="text-2xl font-semibold text-gray-800 mt-6 mb-4">3. Sharing Your Information</h2>
        <p className="text-gray-700 mb-2">3.1 We do not sell or rent your personal information to third parties.</p>
        <p className="text-gray-700 mb-2">3.2 We may share your information with:</p>
        <ul className="list-disc pl-6 text-gray-700 mb-2">
          <li>Trusted service providers (e.g., payment processors, email services) who operate under confidentiality agreements.</li>
          <li>Legal authorities when required by law or to protect IETE’s rights.</li>
          <li>IETE-affiliated chapters or partners for event coordination or membership services, with your consent.</li>
        </ul>

        <h2 className="text-2xl font-semibold text-gray-800 mt-6 mb-4">4. Data Security</h2>
        <p className="text-gray-700 mb-2">4.1 We implement reasonable security measures, such as encryption and secure servers, to protect your personal information.</p>
        <p className="text-gray-700 mb-2">4.2 However, no method of transmission over the internet is 100% secure, and we cannot guarantee absolute security.</p>

        <h2 className="text-2xl font-semibold text-gray-800 mt-6 mb-4">5. Your Rights</h2>
        <p className="text-gray-700 mb-2">5.1 You have the right to:</p>
        <ul className="list-disc pl-6 text-gray-700 mb-2">
          <li>Access, update, or delete your personal information.</li>
          <li>Opt out of marketing communications.</li>
          <li>Request information about how your data is used.</li>
        </ul>
        <p className="text-gray-700 mb-2">5.2 To exercise these rights, contact us at secretary@iete.org.</p>

        <h2 className="text-2xl font-semibold text-gray-800 mt-6 mb-4">6. Cookies and Tracking</h2>
        <p className="text-gray-700 mb-2">6.1 Our website uses cookies to enhance user experience and analyze traffic.</p>
        <p className="text-gray-700 mb-2">6.2 You can manage cookie preferences through your browser settings, but disabling cookies may affect website functionality.</p>

        <h2 className="text-2xl font-semibold text-gray-800 mt-6 mb-4">7. Third-Party Links</h2>
        <p className="text-gray-700 mb-2">7.1 Our website may contain links to third-party sites. IETE is not responsible for the privacy practices or content of these sites.</p>

        <h2 className="text-2xl font-semibold text-gray-800 mt-6 mb-4">8. Children’s Privacy</h2>
        <p className="text-gray-700 mb-2">8.1 IETE’s services are not intended for individuals under 18. We do not knowingly collect personal information from children.</p>

        <h2 className="text-2xl font-semibold text-gray-800 mt-6 mb-4">9. Changes to This Policy</h2>
        <p className="text-gray-700 mb-2">9.1 IETE may update this Privacy Policy periodically. Changes will be posted on this page, and we encourage you to review it regularly.</p>

        <h2 className="text-2xl font-semibold text-gray-800 mt-6 mb-4">10. Contact Information</h2>
        <p className="text-gray-700 mb-2">
          For questions or concerns regarding this Privacy Policy, please contact:
        </p>
        <p className="text-gray-700 mb-2">
          <strong>The Institution of Electronics and Telecommunication Engineers (IETE)</strong><br />
          2, Institutional Area, Lodi Road, New Delhi - 110003, India<br />
          Email: secretary@iete.org<br />
          Phone: +91-11-43538800
        </p>

        <div className="text-center mt-8 text-gray-600 text-sm">
          <p>© 2025 The Institution of Electronics and Telecommunication Engineers (IETE). All rights reserved.</p>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;