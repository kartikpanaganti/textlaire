import { Box, Link, Typography, Paper } from '@mui/material';
import { Description, Image, PictureAsPdf, Videocam, AudioFile, InsertDriveFile } from '@mui/icons-material';

const AttachmentPreview = ({ attachment }) => {
  // Function to get file size in readable format
  const getFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else if (bytes < 1073741824) return (bytes / 1048576).toFixed(1) + ' MB';
    else return (bytes / 1073741824).toFixed(1) + ' GB';
  };

  // Function to get file icon based on type
  const getFileIcon = () => {
    const type = attachment.fileType?.toLowerCase() || '';
    
    if (type.includes('image')) {
      return <Image fontSize="large" />;
    } else if (type.includes('pdf')) {
      return <PictureAsPdf fontSize="large" />;
    } else if (type.includes('video')) {
      return <Videocam fontSize="large" />;
    } else if (type.includes('audio')) {
      return <AudioFile fontSize="large" />;
    } else if (type.includes('text') || type.includes('document')) {
      return <Description fontSize="large" />;
    } else {
      return <InsertDriveFile fontSize="large" />;
    }
  };

  // Check if it's an image to display preview
  const isImage = attachment.fileType?.toLowerCase().includes('image');
  
  return (
    <Link 
      href={attachment.fileUrl || attachment.filePath}
      target="_blank"
      rel="noopener noreferrer"
      underline="none"
      sx={{ display: 'block', mb: 1, color: 'inherit' }}
    >
      {isImage ? (
        <Box>
          <Box 
            component="img"
            src={attachment.fileUrl || attachment.filePath}
            alt={attachment.fileName}
            sx={{ 
              maxWidth: '100%',
              maxHeight: 200,
              borderRadius: 1,
              display: 'block'
            }}
          />
          <Typography variant="caption" sx={{ mt: 0.5, display: 'block' }}>
            {attachment.fileName} ({getFileSize(attachment.fileSize)})
          </Typography>
        </Box>
      ) : (
        <Paper 
          variant="outlined" 
          sx={{ 
            p: 1, 
            display: 'flex', 
            alignItems: 'center',
            borderRadius: 1
          }}
        >
          <Box sx={{ pr: 1.5 }}>
            {getFileIcon()}
          </Box>
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography variant="body2" noWrap fontWeight="medium">
              {attachment.fileName}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {getFileSize(attachment.fileSize)}
            </Typography>
          </Box>
        </Paper>
      )}
    </Link>
  );
};

export default AttachmentPreview;
