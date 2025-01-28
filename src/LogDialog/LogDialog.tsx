import CloseIcon from '@mui/icons-material/Close';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import IconButton from '@mui/material/IconButton';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableRow from '@mui/material/TableRow';
import Toolbar from '@mui/material/Toolbar';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';

import { useLogging } from '../useAppStore';

export default function LogDialog() {
  const { log, logModalShown, hideLogModal } = useLogging();
  const theme = useTheme();
  const isSmall = useMediaQuery(theme.breakpoints.down('md'));
  return (
    <Dialog
      open={logModalShown}
      fullScreen={isSmall}
      fullWidth
      maxWidth="lg"
      onClose={hideLogModal}
    >
      <Toolbar>
        <IconButton
          edge="start"
          color="inherit"
          onClick={hideLogModal}
          aria-label="close"
        >
          <CloseIcon />
        </IconButton>
        <DialogTitle>
          Log
        </DialogTitle>
      </Toolbar>
      <DialogContent>
        <Table size="small">
          <TableBody>
            {log.map(logEntry => (
              <TableRow key={logEntry.date.getTime()}>
                <TableCell sx={{ whiteSpace: 'nowrap' }}>{logEntry.date.toLocaleString()}</TableCell>
                <TableCell sx={{ width: '100%' }}>{logEntry.body}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </DialogContent>
    </Dialog>
  );
}
