type propType = React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string };
export default function Link2(props: propType) {
  const bp = String(process.env["NEXT_PUBLIC_BASE_DIR"] ?? "");
  const newHref = `${bp}${props.href}`;
  return (
    <a {...props} href={newHref}>{props.children}</a>
  )
}