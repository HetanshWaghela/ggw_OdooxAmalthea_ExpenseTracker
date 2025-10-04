import { useState } from 'react';
import { XMarkIcon, DocumentIcon, PhotoIcon } from '@heroicons/react/24/outline';

const ReceiptViewer = ({ receiptUrl, onClose }) => {
  const [isLoading, setIsLoading] = useState(true);

  const getFileType = (url) => {
    if (!url) return 'unknown';
    const extension = url.split('.').pop().toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension)) {
      return 'image';
    } else if (['pdf'].includes(extension)) {
      return 'pdf';
    }
    return 'unknown';
  };

  const fileType = getFileType(receiptUrl);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900 flex items-center">
            <DocumentIcon className="h-5 w-5 mr-2" />
            Receipt Viewer
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>
        
        <div className="border rounded-lg p-4 bg-gray-50 min-h-96">
          {receiptUrl ? (
            <>
              {fileType === 'image' && (
                <div className="text-center">
                  <img
                    src={receiptUrl}
                    alt="Receipt"
                    className="max-w-full max-h-96 mx-auto rounded-lg shadow-lg"
                    onLoad={() => setIsLoading(false)}
                    onError={() => setIsLoading(false)}
                  />
                  {isLoading && (
                    <div className="flex items-center justify-center h-96">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                  )}
                </div>
              )}
              
              {fileType === 'pdf' && (
                <div className="text-center">
                  <iframe
                    src={receiptUrl}
                    className="w-full h-96 rounded-lg shadow-lg"
                    title="Receipt PDF"
                    onLoad={() => setIsLoading(false)}
                  />
                  {isLoading && (
                    <div className="flex items-center justify-center h-96">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                  )}
                </div>
              )}
              
              {fileType === 'unknown' && (
                <div className="text-center py-20">
                  <DocumentIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Unable to preview this file type</p>
                  <a
                    href={receiptUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 underline mt-2 inline-block"
                  >
                    Download Receipt
                  </a>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-20">
              <PhotoIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No receipt attached</p>
            </div>
          )}
        </div>
        
        <div className="flex justify-end mt-4">
          <button
            onClick={onClose}
            className="btn-secondary"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReceiptViewer;
