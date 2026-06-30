// src/App.tsx
import { ThemeProvider } from "@emotion/react";
import {
  createTheme,
  CssBaseline,
  GlobalStyles,
  Snackbar,
  Stack,
} from "@mui/material";
import React, { useState } from "react";

import Header from "./Header";
import Main from "./Main";
import ProgressDialog from "./ProgressDialog";
import { TransferQueueProvider } from "./app/transferQueue";

const globalStyles = (
  <GlobalStyles styles={{
    "html, body, #root": {
      height: "100%",
      backgroundImage: "url(/bg-dark.webp)",
      backgroundSize: "cover",
      backgroundPosition: "center",
      backgroundRepeat: "no-repeat",
      backgroundAttachment: "fixed"
    }
  }} />
);

const theme = createTheme({
  palette: {
    mode: "dark",
    primary: { main: "#6b7cff" },
    background: {
      default: "transparent",
      paper: "rgba(23, 24, 36, 0.5)",
    }
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.37)",
          backgroundImage: "none",
        },
      },
    },
  },
});

export type SortField = "name" | "time" | "size" | "type";
export type SortOrder = "asc" | "desc";
export type ViewMode = "list" | "grid";

function App() {
  const [search, setSearch] = useState("");
  const [showProgressDialog, setShowProgressDialog] = React.useState(false);
  const [error, setError] = useState<Error | null>(null);

  const [sortField, setSortField] = useState<SortField>("name");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {globalStyles}
      <TransferQueueProvider>
        <Stack sx={{ height: "100%" }}>
          <Header
            search={search}
            onSearchChange={(newSearch: string) => setSearch(newSearch)}
            setShowProgressDialog={setShowProgressDialog}
            sortField={sortField}
            sortOrder={sortOrder}
            onSortChange={(field, order) => {
              setSortField(field);
              setSortOrder(order);
            }}
            viewMode={viewMode}
            onViewChange={setViewMode}
          />
          <Main
            search={search}
            onError={setError}
            sortField={sortField}
            sortOrder={sortOrder}
            viewMode={viewMode}
            setShowProgressDialog={setShowProgressDialog}
          />
        </Stack>
        <Snackbar
          autoHideDuration={5000}
          open={Boolean(error)}
          message={error?.message}
          onClose={() => setError(null)}
        />
        <ProgressDialog
          open={showProgressDialog}
          onClose={() => setShowProgressDialog(false)}
        />
      </TransferQueueProvider>
    </ThemeProvider>
  );
}

export default App;
