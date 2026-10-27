import { useTitle } from '../../components/ui'
import { PHOTOS, photoFor } from "../../photos"

const nameOf = (slug) => slug.split('-').map((w) => w[0].toUpperCase() + w.slice(1)).join(' ')

// Attribution for every product photo (required by the Creative Commons licences)
export default function Credits() {
  useTitle('Photo credits')
  return (
    <>
      <div className="ff-page-head">
        <div className="container">
          <h1>Photo credits</h1>
          <p>Product photos come from Wikimedia Commons and are used under the free licences listed below.</p>
        </div>
      </div>
      <div className="container py-5">
        <div className="ff-card overflow-hidden">
          <div className="table-responsive">
            <table className="table ff-table">
              <thead><tr><th>Product</th><th>Photo</th><th>Photographer</th><th>Licence</th></tr></thead>
              <tbody>
                {Object.entries(PHOTOS).map(([slug, p]) => (
                  <tr key={slug}>
                    <td><div className="d-flex align-items-center gap-3"><img src={photoFor(slug)} alt="" className="ff-thumb" loading="lazy" /><span className="fw-bold">{nameOf(slug)}</span></div></td>
                    <td className="small"><a href={p.source} target="_blank" rel="noreferrer">{p.title}</a></td>
                    <td>{p.artist}</td>
                    <td className="small">{p.licenseUrl ? <a href={p.licenseUrl} target="_blank" rel="noreferrer">{p.license}</a> : p.license}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <p className="small text-muted mt-3 mb-0">Photos are shown at a reduced size and cropped to fit the product cards.</p>
      </div>
    </>
  )
}
