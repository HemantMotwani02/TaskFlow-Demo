import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import ProfileImage from './ProfileImage/ProfileImage';
import roleUtils from '../utils/roleUtils';
import { ROLES } from '../store';

const Nav = () => {
    const auth = roleUtils.getUserFromLocalStorage();

    const [name, setName] = useState('');

    useEffect(() => {
        if (auth && auth.result && auth.result.name) {
            setName(auth.result.name);
        }
    }, [auth]);

    const navigate = useNavigate();

    const handleLogout = () => {

        localStorage.clear();
        // localStorage.removeItem('users');
        setPath('');
        navigate('/Login');
    }

    const [path, setPath] = useState('');
    useEffect(() => {
        if (auth && auth.result && auth.result.profile) {
            const fromDB = auth.result.profile.replace(/\\/g, '/').replace('public/', '');
            if (fromDB === null || fromDB === '' || fromDB === 'No File') {
                setPath('');
            } else {
                setPath("http://localhost:7007" + fromDB);
            }
            console.log('Profile path:', path);
        }
    }, [auth]);

    // http://localhost:7007/uploads/profile-1714108477910.jpg
    // public\\uploads\\profile-1714116197021.jpg

    return (
        <div className='NavBar-container '>
            <ul className='navbaritems  NavBar '>
                <div className='navbar-left-items'>
                    <li><Link to='/'>Home</Link></li>
                    <li><Link to='/Project'>Project</Link></li>
                    {/* <li><Link to='/Task'>Task</Link></li>
                    <li><Link to='/Logs'>Log</Link></li> */}
                </div>
                <div className='navbar-right-items'>
                    {auth ? <>
                        {auth.result.role === ROLES.ADMIN ?
                            <div className='d-flex gap-3'>
                                <li ><Link to='/SignUp'>Add User</Link></li>
                                <li ><Link to='/add-new-project'>Add-project</Link></li>

                            </div>
                            : <></>
                        }
                        <ProfileImage user={auth.result} size="sm" />
                        <Link to='/EditDetails' style={{ color: "Black", textDecoration: "None", fontSize: "24px" }}>Welcome {name}</Link>

                        <li><Link onClick={handleLogout} to='/Login' className='text-danger'>Logout</Link></li>
                    </>

                        : <>
                            <li><Link to='/Login'>Login</Link></li></>
                    }

                </div>
            </ul>
        </div>
    )
}

export default Nav;