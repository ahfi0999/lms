import DownloadFile from './DownloadFile';

type ResumesProps = {
  resumeFiles?: string[];
};

function Resumes(props: ResumesProps) {
  if (!props.resumeFiles?.length) {
    return (
      <div className="prose">
        <p>No resume templates are updated for this course.</p>
      </div>
    );
  }

  return (
    <div className="prose">
      <ul>
        {props.resumeFiles.map((file, index) => (
          <li key={index}>
            <DownloadFile azureFileUrl={file} />
          </li>
        ))}
      </ul>
    </div>
  );
}
export default Resumes;
