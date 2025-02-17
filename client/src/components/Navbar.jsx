import { FaBell, FaUserCircle } from "react-icons/fa";

function Navbar() {
  return (
    <nav className="bg-white shadow-md p-4 flex justify-between items-center">
      <h2 className="text-xl font-semibold text-gray-800">Texlaire</h2>
      <div className="flex items-center gap-4">
        <button className="p-2 rounded-full hover:bg-gray-200">
          <FaBell className="text-gray-600" />
        </button>
        <div className="flex items-center gap-2">
          <FaUserCircle className="text-gray-600 text-2xl" />
          <span className="text-gray-800 font-medium">User</span>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
