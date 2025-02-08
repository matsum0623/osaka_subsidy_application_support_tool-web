import {
  Outlet,
  useOutletContext,
} from "@remix-run/react"

export default function Edit() {
  const context = useOutletContext();
  return (
    <div>
      <Outlet context={context}/>
    </div>
  )
}