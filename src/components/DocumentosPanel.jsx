import FormDocumentos from "./FormDocumentos";
import ListaDocumentos from "./ListaDocumentos";

export default function DocumentosPanel({ choferId }) {
  return (
    <div>
      <FormDocumentos choferId={choferId} />
      <ListaDocumentos choferId={choferId} />
    </div>
  );
}
