import type { RefObject } from "react";
import { Trash } from "lucide-react";
import {
  Attachment,
  AttachmentAction,
  AttachmentActions,
  AttachmentContent,
  AttachmentGroup,
  AttachmentMedia,
  AttachmentTitle,
} from "@/components/ui/attachment";
import {
  Field,
  FieldError as FieldErrorText,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import type { WeightEntry } from "./types";
import { useDeleteWeightPhoto, weightPhotoUrl } from "./use-weight-entries";

type WeightPhotosProps = {
  entry?: WeightEntry;
  photosRef: RefObject<HTMLInputElement | null>;
  onFilesChange: (files: File[]) => void;
  error?: { message?: string };
};

export const WeightPhotos = ({
  entry,
  photosRef,
  onFilesChange,
  error,
}: WeightPhotosProps) => {
  const deletePhoto = useDeleteWeightPhoto();

  return (
    <Field data-invalid={!!error}>
      <FieldLabel htmlFor="photos">Photos</FieldLabel>

      {entry && entry.photos.length > 0 && (
        <AttachmentGroup>
          {entry.photos.map((photo, i) => (
            <Attachment key={photo.id} orientation="vertical">
              <AttachmentMedia variant="image">
                <img
                  src={weightPhotoUrl(photo.id)}
                  alt={`Photo ${i + 1}`}
                  loading="lazy"
                />
              </AttachmentMedia>
              <AttachmentContent>
                <AttachmentTitle>Photo {i + 1}</AttachmentTitle>
              </AttachmentContent>
              <AttachmentActions>
                <AttachmentAction
                  type="button"
                  variant={"destructive"}
                  aria-label={`Delete photo ${i + 1}`}
                  disabled={deletePhoto.isPending}
                  onClick={() => deletePhoto.mutate(photo.id)}
                >
                  <Trash className="size-4" />
                </AttachmentAction>
              </AttachmentActions>
            </Attachment>
          ))}
        </AttachmentGroup>
      )}

      <Input
        id="photos"
        type="file"
        multiple
        onChange={(e) => onFilesChange(Array.from(e.target.files ?? []))}
        ref={photosRef}
      />

      <FieldErrorText errors={[error]} />
    </Field>
  );
};
