import { iconSrcSet, withBase } from '../lib/paths';
import type { Project } from '../types/project';

/** The browser artwork is a labeled placeholder, never a claimed project. */
function Preview({ project, modal = false }: { project: Project; modal?: boolean }) {
  if (project.image) return <div className={`project-preview project-preview--image ${modal ? 'project-preview--modal' : ''}`}><img src={withBase(project.image.src)} alt={project.image.alt} width={project.image.width ?? 1200} height={project.image.height ?? 675} loading="lazy" decoding="async" /></div>;
  const placeholderArt = project.id === '01' ? 'storefront' : project.id === '02' ? 'diamond' : 'spark';
  return <div className={`project-preview project-preview--${project.id} ${modal ? 'project-preview--modal' : ''}`} role="img" aria-label={`Illustrative screenshot placeholder for ${project.title}; not a completed project`}>
    <div className="mock-browser" aria-hidden="true"><div className="mock-bar"><span className="mock-dots"><i></i><i></i><i></i></span><span className="mock-address">PROJECT PREVIEW</span></div><div className="mock-page"><div className="mock-nav"><span></span><span></span></div><div className="mock-body"><div className="mock-copy"><i></i><i></i><i></i><i></i></div><div className="mock-art"></div></div><div className="mock-footer"><i></i><i></i><i></i></div></div></div>
    <img className="project-art" src={withBase(`images/ai/${placeholderArt}.webp`)} srcSet={iconSrcSet(placeholderArt)} sizes={modal ? "240px" : "(max-width: 600px) 56px, 96px"} width="192" height="192" loading="lazy" decoding="async" alt="" aria-hidden="true" />
    <span className="preview-label">PLACEHOLDER</span>
  </div>;
}
function Details({ project }: { project: Project }) {
  if (!project.image) return <div className="project-detail-copy"><div><span>STATUS</span><p>Illustrative placeholder for a future practice project.</p></div><div><span>PROJECT TYPE</span><p>{project.title}</p></div></div>;
  return <div className="project-detail-copy"><div><span>OVERVIEW</span><p>{project.summary}</p></div>{project.goal && <div><span>GOAL</span><p>{project.goal}</p></div>}{project.builtWith && <div><span>BUILT WITH</span><p>{project.builtWith}</p></div>}</div>;
}
export default function ProjectCard({ project }: { project: Project }) {
  const placeholder = !project.image;
  return <article className="project-card" data-project-card>
    <div className="project-tile">
      <div className="project-tilt"><Preview project={project} /></div>
      <div className="project-card-body"><div className="project-meta"><span>{placeholder ? 'PLACEHOLDER' : 'PRACTICE PROJECT'}</span><span>{project.id} / 03</span></div><h3>{project.title}</h3><p>{project.summary}</p><details className="project-details"><summary className="project-details-toggle">View details <span aria-hidden="true">↗</span></summary><div className="project-inline-detail"><p>{placeholder ? 'This is a placeholder, not a completed project.' : 'Practice project.'}</p><Details project={project} /></div></details></div>
    </div>
    <dialog className="project-dialog" aria-labelledby={`project-dialog-title-${project.id}`} data-project-dialog>
      <div className="dialog-header"><span>{placeholder ? 'PROJECT PLACEHOLDER' : 'PRACTICE PROJECT'} / {project.id}</span><button className="round-control" type="button" data-close-dialog aria-label="Close project details">×</button></div>
      <div className="dialog-content"><Preview project={project} modal /><div className="dialog-text"><p className="dialog-kicker">{placeholder ? 'NOT A COMPLETED PROJECT' : 'PRACTICE WORK'}</p><h3 id={`project-dialog-title-${project.id}`}>{project.title}</h3><p className="dialog-intro">{placeholder ? 'This is an illustrative placeholder for a future practice project, not completed client work.' : project.summary}</p><Details project={project} /><a className="text-link" href="#contact" data-dialog-contact>Talk about your website <span aria-hidden="true">↗</span></a></div></div>
    </dialog>
  </article>;
}
