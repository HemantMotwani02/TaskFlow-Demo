import EachLog from "./EachLog";

function LogTableComponent({ item, parentFunction,project_id,task_id ,flag}) {
    
    return (
        <>
            {
                item.logs.map((eachLog,index) => (
                    <EachLog index={index+1} flag={flag} project_id={project_id} task_id={task_id} item={item} parentFunction={parentFunction} eachLog={eachLog} />
                ))

            }

        </>
    )
}

export default LogTableComponent;