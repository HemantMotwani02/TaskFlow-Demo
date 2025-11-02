import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import roleUtils from '../../utils/roleUtils';
import { ROLES } from '../../store';
const localhost = 'http://localhost:7007';



const EachProjectCard = ({ eachPro, parentFunction }) => {
  const auth = roleUtils.getUserFromLocalStorage();
  const name = auth?.result?.name;
  const role = auth?.result?.role;
  const navigate = useNavigate();

  const handleCardClick = (project_id) => {
    navigate(`/project/${project_id}`)
  }

  const handleCompleteBtnClicked = async (project_id, project_name) => {
    let response = await axios.post(`${localhost}/project-update/${project_id}`, {
      status: 'completed'
    }, {
      headers: {
        Authorization: `Bearer ${auth.result.token}`
      }
    });

    let result = await response.data;

    if (result.status == 'unsuccess') {
      alert('Error! Cannot be updated');
    } else {
      alert(`Project: ${project_name}
      Marked as Completed`);
      parentFunction();
    }
  }

  return (

    <>
      <div id={eachPro.project_id} className="card each-project-sidebar-card" >
        <div className="card-body each-project-sidebar-card-body">
          <div className='d-flex justify-content-between'>
            <h5 className="card-title">{eachPro.project_name}</h5>
            {role === ROLES.DEVELOPER ?
              (
                <div className='d-flex gap-3'>
                  <p style={{ color: 'green' }}><b>Manager: </b>{eachPro.userinfo.name}</p>
                  <p style={{ color: 'green' }}><b>Assigned At: </b>{eachPro.assignments[0].created_at.split('T')[0]}</p>

                </div>
              )
              : (role === ROLES.ADMIN && eachPro.status === 'pending') ? <button onClick={() => { handleCompleteBtnClicked(eachPro.project_id, eachPro.project_name) }} style={{ borderRadius: '5px', padding: '7px' }} className='btn btn-success'>completed</button> : <></>
            }
          </div>
          <h6 className="card-text"><b>Status :</b>{eachPro.status}</h6>
          <p className="card-text"><b>Description: </b>{eachPro.project_details}</p>
          <p className="card-text"><b>Created At :</b>{eachPro.created_at.split('T')[0]}</p>
          <p className="card-text"><b>Updated At :</b>{eachPro.updated_at.split('T')[0]}</p>
          <p onClick={() => { handleCardClick(eachPro.project_id) }} className="card-link link">View More</p>
        </div>
      </div>
      <hr />
    </>
  )
}

export default EachProjectCard;