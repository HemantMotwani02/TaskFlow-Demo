import Axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import roleUtils from '../utils/roleUtils';


function EditDetails() {
    const auth = roleUtils.getUserFromLocalStorage();

    const navigate = useNavigate();
    const [name, setName] = useState(auth?.result?.name || '');
    const [email, setEmail] = useState(auth?.result?.email || '');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [profile, setProfile] = useState('');


    function handleChange(event) {
        const { name, value } = event.target;
        switch (name) {
            case 'name':
                setName(value);
                break;
            case 'email':
                setEmail(value);
                break;
            case 'password':
                setPassword(value);
                break;
            case 'confirmPassword':
                setConfirmPassword(value);
                break;
            default:
                break;
        }
    }



    //auth.result.uid
    async function handleEditDetails(event) {
        event.preventDefault();

        if (password !== confirmPassword) {
            alert("Password and Confirm password did not match");
            return;
        }

        const formData = new FormData();
        formData.append('name', name);
        formData.append('email', email);
        formData.append('password', password);
        formData.append('confirmPassword', confirmPassword);
        formData.append('profile', profile);
        formData.append('id', auth.result.user_id); // Assuming id is required in your request

        try {
            const response = await Axios.put("http://127.0.0.1:7007/EditDetails", formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    Authorization: `Bearer ${roleUtils.getTokenFromLocalStorage()}`
                }
            });

            console.log("Response:", response.data);
            if (response.data.status == 'success') {
                alert("User Details Updated");
                localStorage.setItem('user', JSON.stringify((response.data)));
                navigate('/');
            } else {
                alert("Error");
            }
        } catch (error) {
            console.error("Error in Updating Data", error);
        }

    }



    return (

        <div>
            <div><p className="link" onClick={() => navigate(-1)}>Back</p></div>
            <form style={{ display: "flex", flexDirection: "Column", width: "500px", gap: "15px", margin: "auto", padding: "20px", }} encType='multipart/form-data'>
                <h2>Edit User Details</h2>
                <label for="Profile">Upload Profile</label>
                {/* <div style={{ border: "1px solid black", height: '60px ', display: "flex", justifyContent: "center", alignItems: "center", width: "460x" }}> */}
                {/* </div> */}
                
                <input
                    name="profile"
                    type='file'
                    placeholder='Upload file'
                    accept='.png, .jpg, .jpeg'
                    onChange={(event) => setProfile(event.target.files[0])}
                    class="form-control"
                />


                <input
                    type='text'
                    placeholder='Name'
                    name='name'
                    value={name}
                    onChange={handleChange}
                    class="form-control"
                />
                <input
                    type='email'
                    placeholder='Email'
                    name='email'
                    value={email}
                    onChange={handleChange}
                    class="form-control"
                />
                <input
                    type='password'
                    placeholder='Password'
                    name='password'
                    value={password}
                    onChange={handleChange}
                    class="form-control"
                />
                <input
                    type='password'
                    placeholder='Confirm Password'
                    name='confirmPassword'
                    value={confirmPassword}
                    onChange={handleChange}
                    class="form-control"
                />
                <button onClick={handleEditDetails} class="btn btn-dark btn-md">Save Changes</button>
            </form>

        </div>
    );
}

export default EditDetails;
