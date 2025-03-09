// import './App.css';
import logo from './assets/logo.svg';
import workAtBeach from './assets/beach-work.jpg';

function App() {
  return (
    <>
      <div className="grid lg:grid-cols-2 2xl:grid-cols-5">
        <div className="mx-auto max-w-md bg-gray-100 px-8 py-12 sm:max-w-xl lg:max-w-full lg:px-12 lg:py-24 2xl:col-span-2">
          <img className="h-10" src={logo} alt="Workcation" />
          <img
            className="mt-6 rounded-lg object-center shadow-xl sm:mt-8 sm:h-64 sm:w-full sm:object-cover lg:hidden"
            src={workAtBeach}
            alt="woman workcationing on the beach"
          />
          <h1 className="mt-6 text-2xl font-bold text-gray-900 sm:mt-8 sm:text-4xl lg:text-3xl">
            You can work from anywhere. <br className="hidden lg:inline" />
            <span className="text-indigo-500">Take advantage of it.</span>
          </h1>
          <p className="mt-2 text-gray-600 sm:mt-4 sm:text-xl">
            Workcation helps you find work-friendly rentals in beautiful
            locations so you can enjoy some nice weather even when you're not on
            vacation.
          </p>
          <div className="mt-4 sm:mt-6">
            <a
              className="inline-block rounded-lg bg-indigo-500 px-5 py-3 text-sm font-semibold tracking-wider text-white uppercase shadow-lg sm:text-base"
              href="#"
            >
              Book your escape
            </a>
          </div>
        </div>
        <div className="relative hidden bg-gray-100 lg:block 2xl:col-span-3">
          <img
            className="absolute inset-0 h-full w-full object-cover object-center"
            src={workAtBeach}
            alt="woman workcationing on the beach"
          />
        </div>
      </div>
    </>
  );
}

export default App;
