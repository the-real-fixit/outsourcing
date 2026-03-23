import { Link } from 'react-router-dom';

const RoleSelection = () => {
    return (
        <div className="flex justify-center gap-6 my-12 px-4">
            <Link
                to="/register?role=client"
                className="group flex flex-col items-center justify-center w-52 h-20 bg-gray-200 rounded-2xl shadow-sm hover:shadow-md hover:bg-gray-300 transition-all duration-300 text-center p-6 cursor-pointer"
            >
                <span className="text-lg font-bold text-gray-800 group-hover:text-black">Quiero contratar</span>
                <span className="text-sm text-gray-600 group-hover:text-gray-800 mt-1">Crea una cuenta</span>
            </Link>

            <Link
                to="/register?role=provider"
                className="group flex flex-col items-center justify-center w-52 h-20 bg-gray-200 rounded-2xl shadow-sm hover:shadow-md hover:bg-gray-300 transition-all duration-300 text-center p-6 cursor-pointer"
            >
                <span className="text-lg font-bold text-gray-800 group-hover:text-black">Quiero Trabajar</span>
                <span className="text-sm text-gray-600 group-hover:text-gray-800 mt-1">Crea una cuenta</span>
            </Link>
        </div>
    );
};

export default RoleSelection;
