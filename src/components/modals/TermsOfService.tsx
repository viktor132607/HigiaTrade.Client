import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface TermsOfServiceProps {
  isOpen: boolean;
  onClose: () => void;
}

const TermsOfService = ({ isOpen, onClose }: TermsOfServiceProps) => {
  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto p-4 sm:p-6">
          <div className="flex min-h-full items-end justify-center text-center sm:items-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-[2rem] bg-white p-5 text-left align-middle shadow-xl transition-all sm:p-6">
                <Dialog.Title
                  as="h3"
                  className="flex items-center justify-between gap-4 text-lg font-medium leading-6 text-slate-950"
                >
                  <span>Terms of service</span>
                  <button
                    type="button"
                    className="rounded-full border border-slate-200 p-2 text-slate-500 transition hover:border-primary-300 hover:text-primary-700"
                    onClick={onClose}
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </Dialog.Title>
                <div className="mt-4 max-h-[65vh] space-y-4 overflow-y-auto pr-2 text-slate-700">
                  <section className="space-y-2">
                    <h4 className="font-semibold">1. General</h4>
                    <p className="text-sm">
                      These terms govern the relationship between HygiaTrade and customers using the online store.
                    </p>
                  </section>

                  <section className="space-y-2">
                    <h4 className="font-semibold">2. Account registration</h4>
                    <p className="text-sm">
                      You need a valid email address to create an account, place orders, and manage personal details.
                    </p>
                  </section>

                  <section className="space-y-2">
                    <h4 className="font-semibold">3. Orders and payment</h4>
                    <p className="text-sm">
                      All prices are shown in euro (EUR) and include VAT. Payment can be made using the methods shown at checkout.
                    </p>
                  </section>

                  <section className="space-y-2">
                    <h4 className="font-semibold">4. Delivery</h4>
                    <p className="text-sm">
                      Orders are shipped with courier partners. Typical delivery time for in-stock items is 2 to 5 business days.
                    </p>
                  </section>

                  <section className="space-y-2">
                    <h4 className="font-semibold">5. Returns and claims</h4>
                    <p className="text-sm">
                      Unused products can be returned within 14 days of delivery in their original condition.
                    </p>
                  </section>

                  <section className="space-y-2">
                    <h4 className="font-semibold">6. Personal data</h4>
                    <p className="text-sm">
                      Personal data is processed for account management, checkout, and order updates in line with applicable privacy requirements.
                    </p>
                  </section>
                </div>

                <div className="mt-6">
                  <button
                    type="button"
                    className="inline-flex w-full justify-center rounded-2xl bg-slate-950 px-4 py-3 text-sm font-medium text-white transition hover:bg-primary-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 sm:w-auto"
                    onClick={onClose}
                  >
                    Close
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default TermsOfService; 
