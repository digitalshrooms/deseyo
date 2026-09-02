import { useSearchParams, useNavigate } from 'react-router-dom';
import { XCircle, RefreshCw, ArrowLeft } from 'lucide-react';

export const PaymentFailed = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const paymentId = searchParams.get('id');

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-6">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="flex justify-center">
          <div className="w-20 h-20 rounded-full bg-red-900/30 border border-red-600/30 flex items-center justify-center">
            <XCircle className="w-10 h-10 text-red-400" />
          </div>
        </div>

        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Platba se nezdařila</h1>
          <p className="text-gray-400">
            Bohužel se platbu nepodařilo dokončit. Zkuste to prosím znovu nebo použijte
            jinou platební metodu.
          </p>
          {paymentId && (
            <p className="text-gray-600 text-xs mt-2">ID platby: {paymentId}</p>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => navigate('/cenik')}
            className="inline-flex items-center justify-center gap-2 bg-teal-500 hover:bg-teal-400 text-white font-semibold px-7 py-3.5 rounded-xl transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Zkusit znovu
          </button>
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center justify-center gap-2 bg-gray-800 hover:bg-gray-700 text-white font-semibold px-7 py-3.5 rounded-xl transition-colors border border-gray-700"
          >
            <ArrowLeft className="w-4 h-4" />
            Zpět domů
          </button>
        </div>

        <p className="text-gray-600 text-sm">
          Potřebujete pomoc?{' '}
          <a href="mailto:podpora@deseyo.cz" className="text-teal-400 hover:text-teal-300 transition-colors">
            podpora@deseyo.cz
          </a>
        </p>
      </div>
    </div>
  );
};
