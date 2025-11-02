import axios from "axios";
import { useEffect, useState } from "react";

function Projectmembers_rhs({ project_id }) {
    const [member, setMember] = useState();

    useEffect(() => {
        const getMembersByPid = async () => {
            let response = await axios.get(`http://localhost:7007/project-details-members/${project_id}`)
            let result = await response.data;
            console.log(result.result[0]);

            setMember(result.result[0].assignments);
        }
        getMembersByPid();
    }, []);

    return (<div className="Project-Member-Component"><h2 className="project_h" style={{ textAlign: 'center' }}>Project Members</h2>
        {
            member ? (
                <ul className="list-group ">

                    <li className="list-group-item active " style={{ backgroundColor: '#212529' }}>Assigned To</li>
                    {
                        member.map((item) => (
                            <li className="list-group-item"><div className="list-m"><span><b>Name: </b>{item.userinfo.name}</span><span><b>EmpID: </b>{item.userinfo.user_id}</span></div></li>
                        ))
                    }
                </ul>


            ) : (<div>No Members</div>)
        }


    </div>

    )
}

export default Projectmembers_rhs;