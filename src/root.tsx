import SimpleTable from "./examples/simple-table";
import SortableColumns from "./examples/sortable-columns";

export default () => {
  return (
    <>
      <head>
        <meta charSet="utf-8" />
        <title>Qwik Blank App</title>
      </head>
      <body>
        <h1>Simple Table</h1>
        <SimpleTable />
        <h1>Sortable Columns</h1>
        <SortableColumns />
      </body>
    </>
  );
};
