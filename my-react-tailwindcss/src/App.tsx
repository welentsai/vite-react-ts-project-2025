// import './App.css';
import logo from './assets/logo.svg';
import workAtBeach from './assets/beach-work.jpg';

function App() {
  return (
    <>
      <div className="px-8 py-12">
        <img className="h-10" src={logo} alt="Workcation" />
        <img
          className="mt-6 rounded-lg shadow-xl"
          src={workAtBeach}
          alt="woman workcationing on the beach"
        />
        <h1 className="mt-6 text-2xl font-bold text-gray-900">
          You can work from anywhere.{' '}
          <span className="text-indigo-500">Take advantage of it.</span>
        </h1>
        <p className="mt-2 text-gray-600">
          Workcation helps you find work-friendly rentals in beautiful locations
          so you can enjoy some nice weather even when you're not on vacation.
        </p>
        <div className="mt-4">
          <a
            className="inline-block rounded-lg bg-indigo-500 px-5 py-3 text-sm font-semibold tracking-wider text-white uppercase shadow-lg"
            href="#"
          >
            Book your escape
          </a>
        </div>
      </div>
    </>
  );
}

export default App;
