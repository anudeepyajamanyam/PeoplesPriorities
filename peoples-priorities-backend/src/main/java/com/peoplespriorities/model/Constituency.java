package com.peoplespriorities.model;

import jakarta.persistence.*;
import lombok.*;

/**
 * Represents an Indian parliamentary constituency.
 */
@Entity
@Table(name = "constituencies")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Constituency {

    @Id
    @Column(name = "id", length = 50)
    private String id;

    @Column(name = "name", nullable = false)
    private String name;

    @Column(name = "state")
    private String state;

    @Column(name = "mp_name")
    private String mpName;

    @Column(name = "mp_user_id")
    private String mpUserId;
}
