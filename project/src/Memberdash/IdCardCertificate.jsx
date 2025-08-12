
import React, { useState, useEffect, useRef } from 'react';
import html2pdf from 'html2pdf.js'; // Import html2pdf as an ES Module
import { AlertCircle, Award, Download } from 'lucide-react';
import { getIdCardAndCertificate } from '../Services/ApiServices/ApiService'; // Adjust path as needed

const IdCardCertificate = () => {
  const [type, setType] = useState('both');
  const [htmlContent, setHtmlContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const contentRef = useRef(null);
  const token = sessionStorage.getItem('token'); // Adjust based on your auth method

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      const response = await getIdCardAndCertificate(type, token);
      if (response.success) {
        setHtmlContent(response.data); // Assuming response.data contains the HTML string
      } else {
        setError(response.message);
      }
      setLoading(false);
    };
    fetchData();
  }, [type, token]);

  const handleDownload = () => {
    if (contentRef.current) {
      html2pdf()
        .from(contentRef.current)
        .set({
          margin: 10,
          filename: `id-certificate-${type}.pdf`,
          html2canvas: { scale: 2, useCORS: true }, // Enable CORS for external images
          jsPDF: { orientation: 'portrait', unit: 'mm', format: 'a4' },
        })
        .toPdf()
        .get('pdf')
        .then((pdf) => {
          pdf.save(); // Triggers the download
        })
        .catch((error) => {
          console.error('Error generating PDF:', error);
        });
    }
  };
                   // 4xl tha taoh dekh lena 
  return (
    <div className="container mx-auto p-4 max-w-8xl"> 
      <div className="bg-white shadow-lg rounded-lg overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Award className="h-6 w-6 text-blue-600" />
            ID Card & Certificate
          </h2>
          <div className="flex justify-between items-center mt-4">
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="idcard">ID Card</option>
              <option value="certificate">Certificate</option>
              <option value="both">Both</option>
            </select>
            <button
              onClick={handleDownload}
              disabled={loading || !htmlContent}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-white ${
                loading || !htmlContent ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
              } transition-colors`}
            >
              <Download className="h-4 w-4" />
              Download PDF
            </button>
          </div>
        </div>
        <div className="p-6">
          {loading && (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          )}
          {/* {error && (
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md flex items-start gap-2">
              <AlertCircle className="h-5 w-5 mt-0.5" />
              <div>
                <h3 className="font-semibold">Error</h3>
                <p>{error}</p>
              </div>
            </div>
          )} */}
          {htmlContent && (
            <div ref={contentRef} id="id-certificate-content" className="space-y-8">
              <div
                dangerouslySetInnerHTML={{ __html: htmlContent }}
                className="w-full"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default IdCardCertificate;