import { Navigate, Outlet } from 'react-router-dom';
import roleUtils from '../utils/roleUtils';

const PrivateComponent = () => {
        const getRes = roleUtils.getUserFromLocalStorage();
        return getRes ? <Outlet/> : <Navigate to="/Login"/>
}
export default PrivateComponent;